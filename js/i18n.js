/* Nakhla — three languages: English, اردو, العربية.
   Static text uses data-i18n* attributes; scripts call I18N.t(key, vars). */
const I18N = (() => {
  const LANG_KEY = 'nakhla_lang';
  const LANGS = {
    en: { label: 'EN', name: 'English', dir: 'ltr' },
    ur: { label: 'اردو', name: 'اردو', dir: 'rtl' },
    ar: { label: 'عربي', name: 'العربية', dir: 'rtl' },
  };

  // [en, ur, ar]
  const D = {
    /* ---- nav ---- */
    'nav.varieties': ['Varieties', 'اقسام', 'الأصناف'],
    'nav.cities': ['Makkah & Madinah', 'مکہ و مدینہ', 'مكة والمدينة'],
    'nav.journey': ['Palm to plate', 'کھجور کا سفر', 'من النخلة إلى المائدة'],
    'nav.dashboard': ['Dashboard', 'ڈیش بورڈ', 'لوحة التحكم'],
    'nav.basket': ['Basket', 'ٹوکری', 'السلة'],
    'nav.lang': ['Language', 'زبان', 'اللغة'],
    'title.store': ['Dates of Madinah', 'مدینہ کی کھجوریں', 'تمور المدينة'],
    'title.checkout': ['Checkout', 'چیک آؤٹ', 'إتمام الطلب'],

    /* ---- hero ---- */
    'hero.eyebrow': ['From the orchards of Al-Madinah Al-Munawwarah', 'مدینہ منورہ کے باغات سے', 'من بساتين المدينة المنورة'],
    'hero.title': [
      '<span class="line"><span>Dates that carry</span></span><span class="line"><span>the <em>sweetness</em></span></span><span class="line"><span>of Madinah.</span></span>',
      '<span class="line"><span>وہ کھجوریں جن میں</span></span><span class="line"><span>مدینہ کی <em>مٹھاس</em></span></span><span class="line"><span>بسی ہے۔</span></span>',
      '<span class="line"><span>تمورٌ تحمل</span></span><span class="line"><span><em>حلاوة</em> المدينة</span></span><span class="line"><span>المنوّرة.</span></span>',
    ],
    'hero.sub': [
      'Ajwa from the gardens near Quba, Sukkari that melts like brown sugar, Medjool fat as toffee. Sorted by hand every morning and sent to your door.',
      'قبا کے باغوں کی عجوہ، براؤن شوگر کی طرح گھلنے والی سکری، ٹافی جیسی نرم مجدول۔ ہر صبح ہاتھ سے چنی جاتی ہیں اور آپ کے دروازے تک پہنچائی جاتی ہیں۔',
      'عجوة من بساتين قباء، وسكري يذوب كالسكر البني، ومجدول طريّ كالحلوى. تُفرز يدويًا كل صباح وتصلك حتى باب بيتك.',
    ],
    'hero.cta1': ['Choose your dates', 'اپنی کھجوریں چنیں', 'اختر تمورك'],
    'hero.cta2': ['Our story', 'ہماری کہانی', 'قصتنا'],
    'hero.seal': ['HAND-SORTED · PICKED IN MADINAH · SINCE THE HARVEST · ', 'ہاتھ سے چنی · مدینہ سے تازہ · ہر فصل سے · ہاتھ سے چنی · مدینہ سے تازہ · ہر فصل سے · ', 'فرزٌ يدوي · من قلب المدينة · من موسم الحصاد · فرزٌ يدوي · من قلب المدينة · من موسم الحصاد · '],

    /* ---- shop ---- */
    'shop.title': ['The <em>Varieties</em>', 'کھجور کی <em>اقسام</em>', '<em>أصناف</em> التمور'],
    'shop.sub': [
      'Each one tastes of a different corner of the oasis. Move over a card and let it lift.',
      'ہر قسم میں نخلستان کے الگ کونے کا ذائقہ ہے۔ کارڈ پر ماؤس لائیں اور اسے اٹھتا دیکھیں۔',
      'لكل صنف طعمٌ من ركنٍ مختلف في الواحة. مرّر المؤشر فوق البطاقة لتراها ترتفع.',
    ],
    'shop.search': ['Search Ajwa, Sukkari…', 'عجوہ، سکری تلاش کریں…', 'ابحث عن عجوة، سكري…'],
    'shop.all': ['All dates', 'سب کھجوریں', 'كل التمور'],
    'shop.empty': ['No dates match that search. Try another name.', 'اس نام کی کوئی کھجور نہیں ملی۔ کوئی اور نام آزمائیں۔', 'لا توجد تمور بهذا الاسم. جرّب اسمًا آخر.'],
    'card.add': ['＋ Add', '＋ شامل کریں', '＋ أضف'],
    'card.added': ['✓ Added', '✓ شامل ہو گئی', '✓ أُضيفت'],
    'card.soldout': ['Sold out', 'ختم ہو گئی', 'نفدت الكمية'],
    'card.left': ['Only {n} left', 'صرف {n} باقی', 'بقي {n} فقط'],

    /* ---- cities ---- */
    'cities.title': ['Between <em>Makkah</em> &amp; <em>Madinah</em>', '<em>مکہ</em> اور <em>مدینہ</em> کے درمیان', 'بين <em>مكة</em> و<em>المدينة</em>'],
    'cities.sub': [
      'For pilgrims, a date is the first taste after the long day — and the gift they carry home.',
      'حاجیوں کے لیے کھجور لمبے دن کے بعد پہلا ذائقہ ہے — اور وہ تحفہ جو وہ گھر لے جاتے ہیں۔',
      'للحاج والمعتمر، التمرة أول ما يذوقه بعد يوم طويل — والهدية التي يحملها إلى أهله.',
    ],
    'cities.makkah': ['<span class="ar">مكة المكرمة</span> Makkah Al-Mukarramah', '<span class="ar">مكة المكرمة</span> مکہ مکرمہ', '<span class="ar">مكة المكرمة</span>'],
    'cities.madinah': ['<span class="ar">المدينة المنورة</span> Al-Madinah Al-Munawwarah', '<span class="ar">المدينة المنورة</span> مدینہ منورہ', '<span class="ar">المدينة المنورة</span>'],
    'cities.quote': [
      '“Whoever begins the morning with seven Ajwa dates…”',
      '”جو شخص ہر صبح سات عجوہ کھجوریں کھائے…“',
      'لَمْ يَضُرَّهُ فِي ذَلِكَ الْيَوْمِ سُمٌّ وَلَا سِحْرٌ',
    ],
    'cities.source': ['— Sahih al-Bukhari 5445', '— صحیح بخاری 5445', '— صحيح البخاري 5445'],
    'cities.p': [
      'Our family packs dates a short walk from Masjid an-Nabawi. Every harvest is kept in our modern cold storage, so each date reaches you as soft and fresh as the day it was picked — no polish, nothing added.',
      'ہمارا خاندان مسجد نبوی سے چند قدم کے فاصلے پر کھجوریں پیک کرتا ہے۔ ہر فصل ہمارے جدید کولڈ اسٹوریج میں محفوظ رکھی جاتی ہے، اس لیے ہر کھجور آپ تک اتنی ہی نرم اور تازہ پہنچتی ہے جتنی توڑتے وقت تھی — نہ پالش، نہ کوئی ملاوٹ۔',
      'تعبّئ عائلتنا التمور على بُعد خطوات من المسجد النبوي. نحفظ كل محصول في مستودعات تبريد حديثة، فتصلك كل تمرة طريّة طازجة كما قُطفت — بلا تلميع ولا إضافات.',
    ],
    'fact1.b': ['3–5 days', '3–5 دن', '3–5 أيام'],
    'fact1.s': ['from palm to your door', 'درخت سے آپ کے دروازے تک', 'من النخلة إلى بابك'],
    'fact2.s': ['varieties of the oasis', 'نخلستان کی اقسام', 'أصناف من الواحة'],
    'fact3.s': ['added sugar or syrup', 'اضافی چینی یا شیرہ', 'سكر أو شراب مضاف'],
    'alt.makkah': ['The Kaaba in Masjid al-Haram, Makkah, with the clock tower behind', 'مسجد الحرام مکہ میں خانہ کعبہ، پیچھے کلاک ٹاور', 'الكعبة المشرفة في المسجد الحرام بمكة وخلفها برج الساعة'],
    'alt.madinah': ['Masjid an-Nabawi with its green dome at sunset, Madinah', 'غروب آفتاب کے وقت مسجد نبوی اور سبز گنبد، مدینہ', 'المسجد النبوي والقبة الخضراء عند الغروب في المدينة'],
    'alt.door': ['Golden door of the Kaaba surrounded by pilgrims', 'خانہ کعبہ کا سنہری دروازہ اور زائرین', 'باب الكعبة الذهبي وحوله الحجاج'],

    /* ---- journey ---- */
    'journey.title': ['From palm <em>to plate</em>', 'درخت سے <em>دسترخوان تک</em>', 'من النخلة <em>إلى المائدة</em>'],
    'step1.n': ['i.', '۱', '١'], 'step2.n': ['ii.', '۲', '٢'], 'step3.n': ['iii.', '۳', '٣'],
    'step1.h': ['Picked at rutab', 'رطب ہونے پر توڑی گئی', 'تُقطف في مرحلة الرُّطَب'],
    'step1.p': ['Bunches are cut when the dates turn soft and glossy — not a day early.', 'گچھے تب کاٹے جاتے ہیں جب کھجوریں نرم اور چمکدار ہو جائیں — ایک دن بھی پہلے نہیں۔', 'تُقطع العذوق حين يلين التمر ويلمع — لا قبل ذلك بيوم.'],
    'step2.h': ['Sorted by hand', 'ہاتھ سے چھانٹی', 'فرزٌ يدوي'],
    'step2.p': ['Every date is checked by eye. Torn, dry or dull ones never reach a box.', 'ہر کھجور آنکھ سے پرکھی جاتی ہے۔ پھٹی، سوکھی یا بے رونق کھجور کبھی ڈبے تک نہیں پہنچتی۔', 'كل تمرة تُفحص بالعين. المتشققة أو الجافة أو الباهتة لا تصل إلى العلبة أبدًا.'],
    'step3.h': ['Packed & sent', 'پیک اور روانہ', 'تعبئة وإرسال'],
    'step3.p': ['Sealed the same day, with a little card naming the orchard it came from.', 'اسی دن سیل کی جاتی ہے، ساتھ ایک چھوٹا کارڈ جس پر باغ کا نام لکھا ہوتا ہے۔', 'تُغلق في اليوم نفسه، مع بطاقة صغيرة تحمل اسم البستان الذي جاءت منه.'],
    'alt.palm': ['Bunches of ripening dates hanging from a palm', 'کھجور کے درخت پر لٹکتے پکتے گچھے', 'عذوق التمر تنضج على النخلة'],
    'alt.market': ['Trays of dates sorted by variety at a market', 'بازار میں قسم کے حساب سے رکھی کھجوریں', 'صواني التمور مرتبة حسب الصنف في السوق'],
    'alt.shop': ['Dates displayed in a shop counter', 'دکان کے کاؤنٹر پر سجی کھجوریں', 'تمور معروضة في واجهة متجر'],

    /* ---- footer ---- */
    'foot.visit': ['Visit', 'تشریف لائیں', 'زورونا'],
    'foot.order': ['Order', 'آرڈر', 'اطلب'],
    'foot.wa': ['WhatsApp us', 'واٹس ایپ کریں', 'راسلنا على واتساب'],
    'foot.credits': [
      'Photos: Unsplash and Flickr contributors under Creative Commons — full list in <code>images/credits.json</code>.',
      'تصاویر: Unsplash اور Flickr کے فوٹوگرافرز (Creative Commons) — مکمل فہرست <code>images/credits.json</code> میں۔',
      'الصور: مصورو Unsplash وFlickr بترخيص المشاع الإبداعي — القائمة الكاملة في <code>images/credits.json</code>.',
    ],

    /* ---- basket ---- */
    'cart.title': ['Your basket', 'آپ کی ٹوکری', 'سلتك'],
    'cart.close': ['Close basket', 'ٹوکری بند کریں', 'إغلاق السلة'],
    'cart.subtotal': ['Subtotal', 'ذیلی کل', 'المجموع الفرعي'],
    'cart.checkout': ['Checkout →', 'چیک آؤٹ ←', 'إتمام الطلب ←'],
    'cart.wa': ['or quick order on WhatsApp', 'یا واٹس ایپ پر فوری آرڈر', 'أو اطلب سريعًا عبر واتساب'],
    'cart.empty': ['Your basket is still empty.<br>Pick a variety you love.', 'آپ کی ٹوکری ابھی خالی ہے۔<br>اپنی پسند کی کھجور چنیں۔', 'سلتك ما زالت فارغة.<br>اختر الصنف الذي تحبه.'],
    'cart.shipLeft': ['Add <b>{amt}</b> more for free delivery', 'مفت ڈیلیوری کے لیے <b>{amt}</b> مزید شامل کریں', 'أضف <b>{amt}</b> للحصول على توصيل مجاني'],
    'cart.shipFree': ['✦ You get <b>free delivery</b>', '✦ آپ کو <b>مفت ڈیلیوری</b> ملے گی', '✦ لك <b>توصيل مجاني</b>'],
    'cart.payOne': ['{m} available — pay when your dates arrive.', '{m} دستیاب ہے — کھجوریں پہنچنے پر ادائیگی کریں۔', '{m} متاح — ادفع حين تصلك التمور.'],
    'cart.payMany': ['We accept: {m}.', 'ادائیگی کے طریقے: {m}۔', 'طرق الدفع: {m}.'],
    'toast.added': ['{name} added to your basket', '{name} ٹوکری میں شامل ہو گئی', 'أُضيفت {name} إلى سلتك'],
    'toast.stock': ['Only {n} of {name} in stock', '{name} صرف {n} دستیاب ہیں', 'المتوفر من {name} {n} فقط'],
    'toast.updated': ['Store updated', 'دکان اپ ڈیٹ ہو گئی', 'تم تحديث المتجر'],

    /* ---- payment names ---- */
    'pay.cod': ['Cash on Delivery', 'کیش آن ڈیلیوری', 'الدفع عند الاستلام'],
    'pay.bank': ['Bank Transfer', 'بینک ٹرانسفر', 'تحويل بنكي'],
    'pay.stc': ['STC Pay', 'ایس ٹی سی پے', 'STC Pay'],
    'pay.link': ['Card · Mada · Apple Pay', 'کارڈ · مدیٰ · ایپل پے', 'بطاقة · مدى · Apple Pay'],
    'pay.cod.sub': ['Pay when it arrives', 'پہنچنے پر ادائیگی', 'ادفع عند الوصول'],
    'pay.cod.fee': ['+{amt} fee', '+{amt} فیس', '+{amt} رسوم'],
    'pay.bank.sub': ['Direct to our account', 'براہ راست ہمارے اکاؤنٹ میں', 'مباشرة إلى حسابنا'],
    'pay.stc.sub': ['Send to our wallet', 'ہمارے والٹ میں بھیجیں', 'أرسل إلى محفظتنا'],
    'pay.link.sub': ['Secure link on WhatsApp', 'واٹس ایپ پر محفوظ لنک', 'رابط آمن عبر واتساب'],
    'pay.i.cod': ['Pay <b>{amt}</b> in cash to the driver when your dates arrive. Please keep change ready.', 'کھجوریں پہنچنے پر ڈرائیور کو <b>{amt}</b> نقد ادا کریں۔ براہ کرم کھلے پیسے تیار رکھیں۔', 'ادفع <b>{amt}</b> نقدًا للمندوب عند وصول التمور. يُرجى تجهيز المبلغ.'],
    'pay.i.codPickup': ['Pay <b>{amt}</b> in cash when you collect from the shop.', 'دکان سے وصول کرتے وقت <b>{amt}</b> نقد ادا کریں۔', 'ادفع <b>{amt}</b> نقدًا عند الاستلام من المتجر.'],
    'pay.i.bank': ['Transfer <b>{amt}</b> to:', '<b>{amt}</b> اس اکاؤنٹ میں بھیجیں:', 'حوّل <b>{amt}</b> إلى:'],
    'pay.i.bankAfter': ['After ordering, send the receipt on WhatsApp.', 'آرڈر کے بعد رسید واٹس ایپ پر بھیجیں۔', 'بعد الطلب، أرسل الإيصال عبر واتساب.'],
    'pay.i.bankAfterNo': ['Write <b>{no}</b> in the transfer note and send the receipt on WhatsApp.', 'ٹرانسفر نوٹ میں <b>{no}</b> لکھیں اور رسید واٹس ایپ پر بھیجیں۔', 'اكتب <b>{no}</b> في ملاحظة التحويل وأرسل الإيصال عبر واتساب.'],
    'pay.i.stc': ['Send <b>{amt}</b> with STC Pay to:', 'STC Pay سے <b>{amt}</b> اس نمبر پر بھیجیں:', 'أرسل <b>{amt}</b> عبر STC Pay إلى:'],
    'pay.i.stcAfter': ['Then share the screenshot on WhatsApp — we dispatch once it arrives.', 'پھر اسکرین شاٹ واٹس ایپ پر بھیجیں — رقم ملتے ہی آرڈر روانہ کر دیا جائے گا۔', 'ثم شارك لقطة الشاشة عبر واتساب — نرسل الطلب فور وصول المبلغ.'],
    'pay.i.link': ['We’ll WhatsApp you a secure payment link for <b>{amt}</b> — pay with Mada, Visa, Mastercard or Apple Pay. Your card details never touch this site.', 'ہم آپ کو واٹس ایپ پر <b>{amt}</b> کا محفوظ پیمنٹ لنک بھیجیں گے — مدیٰ، ویزا، ماسٹرکارڈ یا ایپل پے سے ادائیگی کریں۔ آپ کے کارڈ کی تفصیل اس ویب سائٹ پر نہیں آتی۔', 'سنرسل لك عبر واتساب رابط دفع آمنًا بقيمة <b>{amt}</b> — ادفع بمدى أو فيزا أو ماستركارد أو Apple Pay. بيانات بطاقتك لا تمر عبر هذا الموقع.'],
    'pay.l.bank': ['Bank', 'بینک', 'البنك'],
    'pay.l.name': ['Name', 'نام', 'الاسم'],
    'pay.copy': ['Copy', 'کاپی', 'نسخ'],
    'pay.copied': ['Copied ✓', 'کاپی ہو گیا ✓', 'تم النسخ ✓'],

    /* ---- checkout ---- */
    'co.back': ['← Back to the shop', '→ دکان پر واپس', '→ العودة إلى المتجر'],
    'co.step1': ['Basket', 'ٹوکری', 'السلة'],
    'co.step2': ['Details', 'تفصیلات', 'البيانات'],
    'co.step3': ['Confirmed', 'تصدیق', 'تم التأكيد'],
    'co.title': ['Almost <em>there</em>', 'بس <em>تھوڑا سا</em> باقی', '<em>اقتربنا</em> من النهاية'],
    'co.sec1': ['Your details', 'آپ کی تفصیلات', 'بياناتك'],
    'co.name': ['Full name', 'پورا نام', 'الاسم الكامل'],
    'co.name.err': ['Please enter your name', 'براہ کرم اپنا نام لکھیں', 'يرجى إدخال اسمك'],
    'co.phone': ['Mobile number', 'موبائل نمبر', 'رقم الجوال'],
    'co.phone.err': ['Enter a valid mobile number', 'درست موبائل نمبر لکھیں', 'أدخل رقم جوال صحيحًا'],
    'co.email': ['Email <small>(optional, for the receipt)</small>', 'ای میل <small>(اختیاری، رسید کے لیے)</small>', 'البريد الإلكتروني <small>(اختياري، للإيصال)</small>'],
    'co.email.err': ['That email doesn’t look right', 'یہ ای میل درست نہیں لگتی', 'البريد الإلكتروني غير صحيح'],
    'co.sec2': ['Delivery', 'ڈیلیوری', 'التوصيل'],
    'co.home': ['Home delivery', 'گھر پر ڈیلیوری', 'توصيل إلى المنزل'],
    'co.home.note': ['Across Saudi Arabia, 1–3 days', 'پورے سعودی عرب میں، 1–3 دن', 'داخل السعودية خلال 1–3 أيام'],
    'co.home.noteFree': ['Free over {amt} · 1–3 days', '{amt} سے زیادہ پر مفت · 1–3 دن', 'مجاني فوق {amt} · 1–3 أيام'],
    'co.pickup': ['Pick up from the shop', 'دکان سے وصول کریں', 'الاستلام من المتجر'],
    'co.free': ['Free', 'مفت', 'مجاني'],
    'co.city': ['City', 'شہر', 'المدينة'],
    'co.city.choose': ['Choose city…', 'شہر منتخب کریں…', 'اختر المدينة…'],
    'co.city.err': ['Choose your city', 'اپنا شہر منتخب کریں', 'اختر مدينتك'],
    'city.madinah': ['Al-Madinah Al-Munawwarah', 'مدینہ منورہ', 'المدينة المنورة'],
    'city.makkah': ['Makkah Al-Mukarramah', 'مکہ مکرمہ', 'مكة المكرمة'],
    'city.jeddah': ['Jeddah', 'جدہ', 'جدة'],
    'city.riyadh': ['Riyadh', 'ریاض', 'الرياض'],
    'city.dammam': ['Dammam', 'دمام', 'الدمام'],
    'city.taif': ['Taif', 'طائف', 'الطائف'],
    'city.other': ['Other city in KSA', 'سعودی عرب کا کوئی اور شہر', 'مدينة أخرى في السعودية'],
    'co.district': ['District', 'محلہ', 'الحي'],
    'co.district.ph': ['e.g. Quba', 'مثلاً قبا', 'مثل: قباء'],
    'co.address': ['Street, building & landmark', 'گلی، عمارت اور قریبی نشانی', 'الشارع والمبنى وأقرب معلم'],
    'co.address.err': ['We need an address to deliver', 'ڈیلیوری کے لیے پتہ ضروری ہے', 'نحتاج العنوان للتوصيل'],
    'co.notes': ['Note for us <small>(optional)</small>', 'ہمارے لیے نوٹ <small>(اختیاری)</small>', 'ملاحظة لنا <small>(اختياري)</small>'],
    'co.notes.ph': ['Gift message, best time to call…', 'تحفے کا پیغام، فون کرنے کا بہتر وقت…', 'رسالة هدية، أفضل وقت للاتصال…'],
    'co.sec3': ['Payment', 'ادائیگی', 'الدفع'],
    'co.sum': ['Your order', 'آپ کا آرڈر', 'طلبك'],
    'co.delivery': ['Delivery', 'ڈیلیوری', 'التوصيل'],
    'co.codFee': ['Cash on delivery fee', 'کیش آن ڈیلیوری فیس', 'رسوم الدفع عند الاستلام'],
    'co.total': ['Total', 'کل رقم', 'الإجمالي'],
    'co.place': ['Place order', 'آرڈر کریں', 'تأكيد الطلب'],
    'co.arrow': ['→', '←', '←'],
    'co.note': ['🔒 No card details are entered on this site.', '🔒 اس ویب سائٹ پر کارڈ کی کوئی تفصیل درج نہیں ہوتی۔', '🔒 لا تُدخل أي بيانات بطاقة في هذا الموقع.'],
    'co.empty.h': ['Your basket is empty', 'آپ کی ٹوکری خالی ہے', 'سلتك فارغة'],
    'co.empty.p': ['Pick a few dates first, then come back here.', 'پہلے کچھ کھجوریں چنیں، پھر یہاں واپس آئیں۔', 'اختر بعض التمور أولًا ثم عُد إلى هنا.'],
    'co.empty.btn': ['Browse dates', 'کھجوریں دیکھیں', 'تصفّح التمور'],
    'co.less': ['Less', 'کم', 'أقل'],
    'co.more': ['More', 'زیادہ', 'أكثر'],
    'done.kicker': ['JazakAllahu khairan', 'جزاک اللہ خیراً', 'جزاك الله خيرًا'],
    'done.title': ['Your order is <em>placed</em>', 'آپ کا آرڈر <em>ہو گیا</em>', 'تم <em>استلام</em> طلبك'],
    'done.order': ['Order', 'آرڈر نمبر', 'رقم الطلب'],
    'done.last.h': ['Last step: send it to us', 'آخری قدم: ہمیں بھیجیں', 'الخطوة الأخيرة: أرسله إلينا'],
    'done.last.p': ['Tap below so the order reaches the shop on WhatsApp. We reply to confirm stock and delivery time.', 'نیچے دبائیں تاکہ آرڈر واٹس ایپ پر دکان تک پہنچ جائے۔ ہم اسٹاک اور ڈیلیوری کا وقت کنفرم کریں گے۔', 'اضغط أدناه ليصل الطلب إلى المتجر عبر واتساب. سنرد لتأكيد التوفر وموعد التوصيل.'],
    'done.wa': ['Send order on WhatsApp', 'آرڈر واٹس ایپ پر بھیجیں', 'أرسل الطلب عبر واتساب'],
    'done.summary': ['Summary', 'خلاصہ', 'الملخص'],
    'done.continue': ['← Continue shopping', '→ خریداری جاری رکھیں', '→ متابعة التسوق'],
    'toast.fix': ['Please fix the highlighted fields', 'براہ کرم نشان زدہ خانے درست کریں', 'يرجى تصحيح الحقول المحددة'],
    'toast.soldout': ['{name} just sold out — removed', '{name} ابھی ختم ہو گئی — نکال دی گئی', 'نفدت {name} للتو — تمت إزالتها'],
    'toast.fewLeft': ['Only {n} {name} left — basket updated', '{name} صرف {n} باقی — ٹوکری اپ ڈیٹ کر دی گئی', 'بقي {n} فقط من {name} — تم تحديث السلة'],
    'toast.saveFail': ['Could not place the order — please check your internet and try again', 'آرڈر نہیں ہو سکا — انٹرنیٹ چیک کر کے دوبارہ کوشش کریں', 'تعذّر إرسال الطلب — تحقّق من الاتصال وحاول مجددًا'],
    'toast.copyFail': ['Copy failed — select it by hand', 'کاپی نہیں ہوا — ہاتھ سے منتخب کریں', 'تعذّر النسخ — حدّده يدويًا'],

    /* ---- default shop texts (used only while the owner hasn't changed them) ---- */
    'def.tagline': ['Dates of Al-Madinah Al-Munawwarah', 'مدینہ منورہ کی کھجوریں', 'تمور المدينة المنورة'],
    'def.address': ['Quba Road, Al-Madinah Al-Munawwarah', 'قبا روڈ، مدینہ منورہ', 'طريق قباء، المدينة المنورة'],
  };

  // Badges typed in the dashboard: translate the common ones, otherwise show as typed
  const BADGES = {
    'most loved': ['سب سے پسندیدہ', 'الأكثر حبًا'],
    'melts in mouth': ['منہ میں گھل جائے', 'تذوب في الفم'],
    'limited': ['محدود', 'كمية محدودة'],
    'everyday': ['روزمرہ', 'يومية'],
    'gift': ['تحفہ', 'هدية'],
    'seasonal': ['موسمی', 'موسمية'],
    'new': ['نئی', 'جديد'],
    'best seller': ['سب سے زیادہ فروخت', 'الأكثر مبيعًا'],
    'sale': ['سیل', 'تخفيض'],
  };
  const CUR = { SAR: ['ریال', 'ر.س'], PKR: ['روپے', 'روبية'], USD: ['ڈالر', 'دولار'], AED: ['درہم', 'د.إ'] };
  const idx = { en: 0, ur: 1, ar: 2 };

  let lang = 'en';
  try { const s = localStorage.getItem(LANG_KEY); if (LANGS[s]) lang = s; } catch (e) {}

  const fill = (str, vars) => (vars ? str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '')) : str);
  function t(key, vars) {
    const row = D[key];
    if (!row) return key;
    return fill(row[idx[lang]] ?? row[0], vars);
  }

  /* ---- product / shop content helpers ---- */
  const pName = (p) => (lang === 'ur' ? p.urdu : lang === 'ar' ? p.arabic : p.name) || p.name;
  // small second line on a card: Arabic name, or the English one when the page is Arabic
  const pAlt = (p) => (lang === 'ar' ? p.name : p.arabic) || '';
  const pDesc = (p) => (lang === 'ur' ? p.descUr : lang === 'ar' ? p.descAr : p.desc) || p.desc || '';
  const cat = (c) => (lang === 'ur' ? c.nameUr : lang === 'ar' ? c.nameAr : c.name) || c.name;
  function badge(b) {
    if (!b || lang === 'en') return b;
    const row = BADGES[String(b).trim().toLowerCase()];
    return row ? row[idx[lang] - 1] : b;
  }
  function unit(u) {
    u = u || '1 kg';
    if (lang === 'en') return u;
    return u.replace(/\bkg\b/gi, lang === 'ur' ? 'کلو' : 'كغ').replace(/\bbox\b/gi, lang === 'ur' ? 'ڈبہ' : 'علبة').replace(/\bg\b/gi, lang === 'ur' ? 'گرام' : 'غ');
  }
  function cur(c) {
    if (lang === 'en' || !CUR[c]) return c;
    return CUR[c][idx[lang] - 1];
  }
  // Shop texts: if the owner kept the sample English text, show its translation
  function setting(key, value) {
    const def = D[`def.${key}`];
    if (def && value === def[0]) return t(`def.${key}`);
    return value;
  }
  function list(items) {
    if (items.length < 2) return items.join('');
    const and = lang === 'ur' ? ' اور ' : lang === 'ar' ? ' و' : ' and ';
    const sep = lang === 'ar' ? '، ' : lang === 'ur' ? '، ' : ', ';
    return items.slice(0, -1).join(sep) + and + items.at(-1);
  }

  /* ---- apply to the page ---- */
  function apply(root = document) {
    const L = LANGS[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = L.dir;
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    root.querySelectorAll('[data-i18n-alt]').forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
    document.querySelectorAll('.lang-switch button').forEach((b) => {
      b.classList.toggle('on', b.dataset.lang === lang);
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
  }

  function set(l) {
    if (!LANGS[l] || l === lang) return;
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  // Builds the EN | اردو | عربي switcher into every .lang-switch on the page
  function mountSwitchers() {
    document.querySelectorAll('.lang-switch').forEach((box) => {
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', 'Language / زبان / اللغة');
      box.innerHTML = Object.entries(LANGS).map(([k, v]) =>
        `<button type="button" data-lang="${k}" lang="${k}" title="${v.name}">${v.label}</button>`).join('');
      box.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b) set(b.dataset.lang); });
    });
  }

  // Set direction immediately so the page doesn't flash left-to-right
  document.documentElement.lang = lang;
  document.documentElement.dir = LANGS[lang].dir;

  return {
    get lang() { return lang; }, LANGS, t, set, apply, mountSwitchers,
    pName, pAlt, pDesc, cat, badge, unit, cur, setting, list,
    isRtl: () => LANGS[lang].dir === 'rtl',
  };
})();
