# Фото и интерактивные модели товаров

Это frontend-функция: backend, API-контракт и цены/остатки не менялись. Медиа сопоставляются по артикулу, а не по поисковому запросу или названию категории.

## Как посмотреть

Запустите проект по [инструкции интеграции](INTEGRATION_RUN.md), откройте `http://127.0.0.1:8010/static/visual-demo.html#products`.

1. Нажмите на фотографию товара: откроется увеличенное изображение с характеристиками.
2. Нажмите **3D** на C16, кабеле 20 м или светильнике 18 Вт.
3. Вращайте мышью/пальцем, меняйте масштаб колёсиком, жестом или кнопками +/−. С клавиатуры доступны стрелки и +/− после фокусировки модели.
4. Выбирайте детали на модели или в списке: справа появляется объяснение.
5. Дополнительное действие: разобрать/собрать кабель, переключить рычаг автомата, включить/выключить светильник.
6. «Спросить Quant» отправляет артикул в чат. «Выбрать количество» открывает отдельную карточку подтверждения и само по себе не добавляет товар.

**Ограничения:** это наглядные модели, созданные геометрией Three.js, не CAD и не точные размеры изделия. Условные цвета и демонстрация механики не являются инструкцией по монтажу. Цены/остатки остаются синтетическими данными прототипа.

## Привязка изображений

| Артикул | Изображение | 3D | Точность изображения |
| --- | --- | --- | --- |
| `EK-VA4729-C16` | `breaker-c16.png` | Автомат | ВА47-29 2P C16, фото производителя IEK |
| `EK-VA4729-C25` | `breaker-c25.png` | Нет | ВА47-29 2P C25, фото производителя IEK |
| `EK-CAB-VVG-325` | `cable-vvg.jpg` | Нет | Иллюстрация серии, не упаковка конкретной бухты |
| `EK-CAB-VVG-325-20` | `cable-vvg.jpg` | Кабель | Иллюстрация серии, условный короткий фрагмент в 3D |
| `EK-LED-18W` / `EK-LED-IP65-18` | `light-ringo.jpg` | Светильник | Пример RINGO; серия в демо-каталоге не задана |
| `EK-LED-IP65-24` | `light-ringo.jpg` | Нет | Только пример формы; не подтверждённое фото изделия 24 Вт |

Имена `EK-LED-IP65-*` используются автономным демо, `EK-LED-18W` — каталогом backend. У неподдерживаемого артикула остаётся стандартная иконка, чужое фото автоматически не подставляется.

## Источники

Все фотографии сохранены локально в `frontend/assets/products/`; runtime не загружает их с сайтов поставщиков.

- [Кабель ВВГ-Пнг(А)-LS 3×2,5 на ekt.kz](https://ekt.kz/catalog/kabel_provod/kabel_silovoy_dlya_statsionarnoy_prokladki_/vvg_p_ng_a_ls_3kh_2_5_0_66_kv_300_gost_ekt/) — иллюстрация серии. [Исходное изображение](https://ekt.kz/upload/iblock/1d2/chztapyjjcxstn2cm1a0ggg20t5zfn7p/vvg_p_ng_a_ls_3kh_2_5_0_66_kv_300_gost_ekt.jpg).
- [ВА47-29 2P C16 IEK](https://www.iek.ru/products/catalog/modulnoe_oborudovanie/modulnoe_oborudovanie_karat/modulnye_avtomaticheskie_vyklyuchateli_karat/modulnye_avtomaticheskie_vyklyuchateli_va47_29/modulnye_avtomaticheskie_vyklyuchateli_va47_29_khar_ka_c/karat_avtomaticheskiy_vyklyuchatel_va47_29_2p_c_16a_4_5ka_iek). [Исходное изображение](https://cdn-01.iek.ru/media/original/9bbfeb1945f404174ebebf85b102ca591a0a6e41ffa7be6f2e5e61296fd0537e.png).
- [ВА47-29 2P C25 IEK](https://www.iek.ru/products/catalog/modulnoe_oborudovanie/modulnoe_oborudovanie_karat/modulnye_avtomaticheskie_vyklyuchateli_karat/modulnye_avtomaticheskie_vyklyuchateli_va47_29/modulnye_avtomaticheskie_vyklyuchateli_va47_29_khar_ka_c/karat_avtomaticheskiy_vyklyuchatel_va47_29_2p_c_25a_4_5ka_iek). [Исходное изображение](https://cdn-01.iek.ru/media/original/174c2b4551c0b44ab6889ca4ae2be6ec7364db3217a5ecc8550730a6648ac3c9.png).
- [RINGO 18W IP65 MEGALIGHT на ekt.kz](https://taldykorgan.ekt.kz/catalog/svetilniki_lampy/svetilniki_germetichnye_dlya_vnutrennego_i_naruzhnogo_osveshcheniya/nakladnye_svetodiodnye_led_dpb_ip65/led_dpb_ringo_18w_1350lm_d220x67_4000k_ip65_megalight_20/) — пример формы. [Исходное изображение](https://ekt.kz/upload/iblock/499/tm00iqbje5qlbr3i0s3n8u99dwd47873/led_dpb_ringo_18w_1350lm_d220x67_4000k_ip65_megalight_20.jpg).

Изображения третьих лиц не получают лицензию проекта. До публичного production-размещения нужно согласовать их использование с партнёром и заменить примеры на утверждённые изображения соответствующих SKU.

## Файлы и границы ответственности

- `frontend/product-media.js`: локальная привязка SKU → изображение/модель, карточка и модальное окно, callbacks в существующий чат.
- `frontend/product-media.css`: адаптивная вёрстка окна, фотографий, подписей и элементов управления.
- `frontend/product-3d.js`: геометрия трёх моделей, OrbitControls, выбор деталей через Raycaster, освобождение GPU-ресурсов при закрытии.
- `frontend/vendor/three/`: Three.js **0.169.0**, `three.module.min.js`, `OrbitControls.js`, `RoundedBoxGeometry.js` из npm-пакета `three`. Лицензия MIT сохранена в `LICENSE`; исходный пакет: <https://www.npmjs.com/package/three/v/0.169.0>.

Three.js загружается только после нажатия 3D. Фотографии загружаются лениво. При переходе на фото или скрытии вкладки анимация останавливается; закрытие окна освобождает ресурсы. Если WebGL не доступен, показывается сообщение и остаётся вкладка «Фото». Для модулей нужен HTTP-сервер, не `file://`.

Frontend отвечает за отображение и управление моделью. Партнёр/backend позднее предоставляет проверенные URL изображений/GLB, идентификаторы SKU и актуальные характеристики. Добавление товара и окончательная проверка остатков остаются на backend; 3D не вызывает API корзины.

## Проверка

Пройдены `demo-smoke.js` и `api-bridge-smoke.js`; эти тесты проверяют существующий диалог и подтверждение корзины, не WebGL. Дополнительный `product-media-smoke.js` проверяет привязку и миниатюры.

Ручная проверка в браузере: все три модели открываются, вращение и кликабельные детали работают, переключение фото/3D работает, просмотр и переход к количеству сохраняют пустую корзину до подтверждения. Карточка ответа backend содержит соответствующую фотографию и кнопку 3D. Окно проверено на desktop и ширине 390 px, горизонтального переполнения нет.
