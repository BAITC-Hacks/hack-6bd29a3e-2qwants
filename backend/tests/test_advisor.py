from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.advisor import TaskFacts, ProblemAdvisor
from app.catalog import CatalogService
from app.chat import ChatService


def facts(**values):
    defaults = dict(scenario='drilling', observation='Нужно отверстие под кабель.',
                    material='unknown', diameter_mm=None, depth_mm=None,
                    communications_checked=None, outdoor=None, sheltered=None,
                    fixtures=None, length_m=None, cable_diameter_mm=None,
                    owns_drill=None, drill_interface='unknown')
    defaults.update(values)
    return TaskFacts(**defaults)


def ready(**values):
    data = dict(material='concrete', diameter_mm=8, depth_mm=40,
                communications_checked=True, owns_drill=False)
    data.update(values)
    return facts(**data)


def service_with_model(*answers):
    service = ChatService(CatalogService())
    client = Mock()
    client.with_options.return_value = client
    client.responses.parse.side_effect = [SimpleNamespace(output_parsed=a) for a in answers]
    service.client = client
    return service


def test_wall_photo_then_clarification_uses_session_context():
    service = service_with_model(facts(), ready())
    first = service.respond_with_attachment('wall', 'Хочу просверлить стену', 'wall.jpg', 'image/jpeg', b'fake-image-for-mock')
    assert first['status'] == 'needs_clarification'
    assert not first['products']
    second = service.respond('wall', 'Бетон, 8 мм, 40 мм, проверено на провода и трубы, перфоратора нет')
    assert second['status'] == 'ready'
    assert len(second['products']) == 3
    assert second['total'] == 45300
    assert 'previous' in service.client.responses.parse.call_args.kwargs['input'][0]['content'][0]['text']
    assert service.pending == service.approved == {}


@pytest.mark.parametrize('changes', [dict(material='drywall'), dict(diameter_mm=20), dict(depth_mm=80), dict(owns_drill=True, drill_interface='other')])
def test_incompatible_hardware_not_recommended(changes):
    result = ProblemAdvisor(CatalogService()).build(ready(**changes))
    assert result['status'] == 'no_match'
    assert not result['products']


def test_stock_and_price_come_from_catalog():
    catalog = CatalogService()
    next(p for p in catalog.products if p['sku'] == 'DEMO-DRILL')['stock'] = 0
    result = ProblemAdvisor(catalog).build(ready())
    assert result['status'] == 'partial'
    assert result['total'] == 3300
    assert result['missing'][0]['sku'] == 'DEMO-DRILL'


def test_cable_quantity_rounds_up_and_outdoors_rejected():
    advisor = ProblemAdvisor(CatalogService())
    result = advisor.build(facts(scenario='cable_route', length_m=5, cable_diameter_mm=6, outdoor=False))
    assert result['recommendations'][0]['quantity'] == 3
    assert result['total'] == 1950
    assert advisor.build(facts(scenario='cable_route', length_m=5, cable_diameter_mm=6, outdoor=True))['status'] == 'no_match'


def test_light_and_session_isolation():
    service = service_with_model(facts(scenario='outdoor_light', outdoor=True, sheltered=True, fixtures=2))
    result = service.respond('lights', 'Хочу светильник на улице')
    assert result['total'] == 9800
    assert not service.advisor.active('another-user')


def test_damage_cancels_pending_purchase_without_model_call():
    service = service_with_model()
    service.respond('danger', 'добавь 2 шт. EK-VA4729-C16')
    result = service.respond('danger', 'Кабель обгорел, что купить?')
    assert result['status'] == 'needs_specialist'
    assert not result['products']
    assert not service.pending
    service.client.responses.parse.assert_not_called()


def test_negative_confirmation_is_not_approval():
    service = service_with_model()
    service.respond('cart', 'добавь 1 шт. DEMO-BIT-8')
    result = service.respond('cart', 'не добавляй')
    assert 'action' not in result
    assert not service.take_approved('cart', 'DEMO-BIT-8', 1)


def test_model_failure_is_safe():
    service = service_with_model()
    service.client.responses.parse.side_effect = RuntimeError('offline')
    result = service.respond('failed', 'Хочу просверлить стену')
    assert result['status'] == 'unavailable'
    assert not result['products']


def test_exact_sku_and_quantity_not_confused_with_diameter():
    service = service_with_model()
    result = service.respond('cart', 'добавь DEMO-BIT-8')
    assert result['requires_confirmation']
    assert service.pending['cart'] == {'sku': 'DEMO-BIT-8', 'quantity': 1}
    assert service.respond('cart', 'да, добавь')['action']['quantity'] == 1


def test_image_detected_danger_has_no_products():
    service = service_with_model(facts(scenario='danger'))
    result = service.respond_with_attachment('danger-photo', 'Подскажи что делать со стеной', 'wall.jpg', 'image/jpeg', b'fake')
    assert result['status'] == 'needs_specialist'
    assert not result['products']
