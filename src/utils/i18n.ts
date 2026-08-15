export type SupportedLanguage =
  | 'auto'
  | 'en'
  | 'my'
  | 'es'
  | 'ja'
  | 'zh'
  | 'ru'
  | 'th'
  | 'vi'
  | 'id'
  | 'ko'
  | 'fr'
  | 'de';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: 'Auto-Detect', nativeName: '🌐 အလိုအလျောက် (Auto Detect)', flag: '🌐' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာဘာသာ', flag: '🇲🇲' },
  { code: 'en', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
];

export function resolveLanguage(lang?: string | null): Exclude<SupportedLanguage, 'auto'> {
  if (!lang || lang === 'auto') {
    if (typeof window !== 'undefined') {
      const tgLang = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
      if (tgLang) {
        const lower = tgLang.toLowerCase();
        if (lower.startsWith('my') || lower.startsWith('bur')) return 'my';
        if (lower.startsWith('ja')) return 'ja';
        if (lower.startsWith('zh')) return 'zh';
        if (lower.startsWith('es')) return 'es';
        if (lower.startsWith('th')) return 'th';
        if (lower.startsWith('vi')) return 'vi';
        if (lower.startsWith('id')) return 'id';
        if (lower.startsWith('ko')) return 'ko';
        if (lower.startsWith('ru')) return 'ru';
        if (lower.startsWith('fr')) return 'fr';
        if (lower.startsWith('de')) return 'de';
        if (lower.startsWith('en')) return 'en';
      }
      const navLang = navigator.language ? navigator.language.toLowerCase() : 'en';
      if (navLang.startsWith('my') || navLang.startsWith('bur')) return 'my';
      if (navLang.startsWith('ja')) return 'ja';
      if (navLang.startsWith('zh')) return 'zh';
      if (navLang.startsWith('es')) return 'es';
      if (navLang.startsWith('th')) return 'th';
      if (navLang.startsWith('vi')) return 'vi';
      if (navLang.startsWith('id')) return 'id';
      if (navLang.startsWith('ko')) return 'ko';
      if (navLang.startsWith('ru')) return 'ru';
      if (navLang.startsWith('fr')) return 'fr';
      if (navLang.startsWith('de')) return 'de';
    }
    return 'my'; // Default to Myanmar for natural local experience
  }
  return (lang as Exclude<SupportedLanguage, 'auto'>) || 'my';
}

const translations: Record<string, Record<string, string>> = {
  // Navigation
  nav_home: {
    en: 'Home',
    my: 'ပင်မ',
    es: 'Inicio',
    ja: 'ホーム',
    zh: '首页',
    ru: 'Главная',
    th: 'หน้าหลัก',
    vi: 'Trang chủ',
    id: 'Beranda',
    ko: '홈',
    fr: 'Accueil',
    de: 'Start'
  },
  nav_characters: {
    en: 'Characters',
    my: 'ဇာတ်ကောင်များ',
    es: 'Personajes',
    ja: 'キャラクター',
    zh: '角色',
    ru: 'Персонажи',
    th: 'ตัวละคร',
    vi: 'Nhân vật',
    id: 'Karakter',
    ko: '캐릭터',
    fr: 'Personnages',
    de: 'Charaktere'
  },
  nav_chats: {
    en: 'Chats',
    my: 'ချက်တင်',
    es: 'Chats',
    ja: 'チャット',
    zh: '聊天',
    ru: 'Чаты',
    th: 'แชท',
    vi: 'Trò chuyện',
    id: 'Obrolan',
    ko: '채팅',
    fr: 'Discussions',
    de: 'Chats'
  },
  nav_settings: {
    en: 'Settings',
    my: 'ဆက်တင်',
    es: 'Ajustes',
    ja: '設定',
    zh: '设置',
    ru: 'Настройки',
    th: 'การตั้งค่า',
    vi: 'Cài đặt',
    id: 'Pengaturan',
    ko: '설정',
    fr: 'Paramètres',
    de: 'Einstellungen'
  },

  // Language Settings Box & Modal
  lang_settings_title: {
    en: 'Language Settings',
    my: 'ဘာသာစကား ဆက်တင်များ',
    es: 'Ajustes de Idioma',
    ja: '言語設定',
    zh: '语言设置',
    ru: 'Настройки Языка',
    th: 'การตั้งค่าภาษา',
    vi: 'Cài đặt Ngôn ngữ',
    id: 'Pengaturan Bahasa',
    ko: '언어 설정',
    fr: 'Paramètres de Langue',
    de: 'Spracheinstellungen'
  },
  lang_settings_desc: {
    en: 'Manage App UI display language & Bot Chat speech language',
    my: 'အက်ပ်မျက်နှာပြင် ဘာသာစကားနှင့် Bot စကားပြော ဘာသာစကားများကို စိတ်ကြိုက် ပြောင်းလဲနိုင်ပါသည်',
    es: 'Configura el idioma de la aplicación y las respuestas del bot',
    ja: 'アプリの表示言語とボットの返信言語を設定',
    zh: '管理应用界面语言和机器人对话回复语言',
    ru: 'Настройка языка интерфейса и языка ответов бота',
    th: 'จัดการภาษาของแอปและภาษาที่บอทจะตอบกลับ',
    vi: 'Quản lý ngôn ngữ ứng dụng và ngôn ngữ phản hồi của bot',
    id: 'Kelola bahasa aplikasi dan bahasa balasan bot',
    ko: '앱 인터페이스 언어 및 봇 응답 언어 관리',
    fr: 'Gérer la langue de l\'application et les réponses du bot',
    de: 'App-Sprache und Bot-Antwortsprache verwalten'
  },
  app_language_title: {
    en: 'App UI Language',
    my: 'အက်ပ် မျက်နှာပြင် ဘာသာစကား',
    es: 'Idioma de la App',
    ja: 'アプリの言語',
    zh: '应用界面语言',
    ru: 'Язык Интерфейса',
    th: 'ภาษาของแอป',
    vi: 'Ngôn ngữ Ứng dụng',
    id: 'Bahasa Aplikasi',
    ko: '앱 언어',
    fr: 'Langue de l\'App',
    de: 'App-Sprache'
  },
  app_language_desc: {
    en: 'Controls menu labels, cards, buttons, and navigation across the app',
    my: 'အက်ပ်တစ်ခုလုံးရှိ စာမျက်နှာများ၊ မီနူးများနှင့် ခလုတ်များအားလုံးတွင် ပြသမည့် ဘာသာစကား',
    es: 'Controla los textos y menús de toda la aplicación',
    ja: 'アプリ全体のメニューやボタンの表示言語',
    zh: '控制整个应用的菜单、按钮和文本显示语言',
    ru: 'Управляет меню, кнопками и текстами в приложении',
    th: 'ควบคุมภาษาของเมนูและปุ่มต่างๆ ในแอป',
    vi: 'Điều chỉnh ngôn ngữ cho các menu và nút bấm trong ứng dụng',
    id: 'Mengatur bahasa menu dan tombol di aplikasi',
    ko: '앱 전체의 메뉴와 버튼에 표시될 언어를 설정합니다',
    fr: 'Contrôle la langue des menus et boutons',
    de: 'Steuert Menüs und Schaltflächen in der gesamten App'
  },
  bot_language_title: {
    en: 'Bot Chat Response Language',
    my: 'Bot စကားပြော ဘာသာစကား',
    es: 'Idioma de Respuesta del Bot',
    ja: 'Bot 返信言語',
    zh: 'Bot 回复语言',
    ru: 'Язык Ответов Бота',
    th: 'ภาษาที่บอทตอบกลับ',
    vi: 'Ngôn ngữ Phản hồi của Bot',
    id: 'Bahasa Balasan Bot',
    ko: '봇 응답 언어',
    fr: 'Langue de Réponse du Bot',
    de: 'Bot-Antwortsprache'
  },
  bot_language_desc: {
    en: 'Characters will strictly talk and narrate actions in this language during chats',
    my: 'ဇာတ်ကောင်များသည် စကားပြောဆိုရာတွင် ဤဘာသာစကားဖြင့် သဘာဝကျကျ ပြန်လည်ဖြေကြားမည်ဖြစ်သည်',
    es: 'Los personajes responderán en este idioma durante las conversaciones',
    ja: 'キャラクターはこの言語で自然に応答し、ロールプレイを行います',
    zh: '角色在对话中将严格使用此语言进行回复和动作描写',
    ru: 'Персонажи будут отвечать на этом языке в диалогах',
    th: 'ตัวละครจะตอบกลับและบรรยายด้วยภาษานี้ในระหว่างการสนทนา',
    vi: 'Nhân vật sẽ phản hồi bằng ngôn ngữ này trong các cuộc trò chuyện',
    id: 'Karakter akan merespons dalam bahasa ini saat mengobrol',
    ko: '캐릭터가 대화 시 이 언어로 자연스럽게 응답합니다',
    fr: 'Les personnages répondront dans cette langue pendant les discussions',
    de: 'Charaktere antworten in den Chats in dieser Sprache'
  },
  click_to_change_lang: {
    en: 'Tap to configure languages',
    my: 'နှိပ်၍ ဘာသာစကား ရွေးချယ်ပြင်ဆင်ပါ',
    es: 'Toca para cambiar idiomas',
    ja: 'タップして言語を変更',
    zh: '点击配置语言',
    ru: 'Нажмите для настройки языка',
    th: 'แตะเพื่อเปลี่ยนภาษา',
    vi: 'Chạm để thay đổi ngôn ngữ',
    id: 'Ketuk untuk mengatur bahasa',
    ko: '탭하여 언어 설정',
    fr: 'Appuyez pour configurer les langues',
    de: 'Tippen zum Konfigurieren'
  },

  // Balances & Currency
  energy: {
    en: 'Energy',
    my: 'စွမ်းအင်',
    es: 'Energía',
    ja: 'エネルギー',
    zh: '能量',
    ru: 'Энергия',
    th: 'พลังงาน',
    vi: 'Năng lượng',
    id: 'Energi',
    ko: '에너지',
    fr: 'Énergie',
    de: 'Energie'
  },
  gems: {
    en: 'Gems',
    my: 'ပတ္တမြား',
    es: 'Gemas',
    ja: 'ジェム',
    zh: '宝石',
    ru: 'Гемы',
    th: 'อัญมณี',
    vi: 'Đá quý',
    id: 'Permata',
    ko: '보석',
    fr: 'Gemmes',
    de: 'Edelsteine'
  },
  verified_status: {
    en: 'Verified',
    my: 'အတည်ပြုပြီး',
    es: 'Verificado',
    ja: '認証済み',
    zh: '已认证',
    ru: 'Подтвержден',
    th: 'ยืนยันแล้ว',
    vi: 'Đã xác minh',
    id: 'Terverifikasi',
    ko: '인증됨',
    fr: 'Vérifié',
    de: 'Verifiziert'
  },
  vip_status: {
    en: 'VIP Status',
    my: 'VIP အဆင့်အတန်း',
    es: 'Estado VIP',
    ja: 'VIPステータス',
    zh: 'VIP 状态',
    ru: 'VIP Статус',
    th: 'สถานะ VIP',
    vi: 'Trạng thái VIP',
    id: 'Status VIP',
    ko: 'VIP 상태',
    fr: 'Statut VIP',
    de: 'VIP-Status'
  },
  free_plan: {
    en: 'Free Plan',
    my: 'အခမဲ့ အသုံးပြုသူ',
    es: 'Plan Gratuito',
    ja: '無料プラン',
    zh: '免费计划',
    ru: 'Бесплатный',
    th: 'แผนฟรี',
    vi: 'Gói miễn phí',
    id: 'Paket Gratis',
    ko: '무료 플랜',
    fr: 'Plan Gratuit',
    de: 'Kostenlos'
  },
  standard_mana: {
    en: 'Standard Energy',
    my: 'ပုံမှန် စွမ်းအင်',
    es: 'Energía Estándar',
    ja: '通常エネルギー',
    zh: '标准能量',
    ru: 'Стандартная Энергия',
    th: 'พลังงานมาตรฐาน',
    vi: 'Năng lượng tiêu chuẩn',
    id: 'Energi Standar',
    ko: '일반 에너지',
    fr: 'Énergie Standard',
    de: 'Standard-Energie'
  },
  upgrade_vip_btn: {
    en: 'Upgrade to Empress VIP',
    my: 'VIP သို့ အဆင့်မြှင့်တင်မည်',
    es: 'Mejorar a VIP Empress',
    ja: 'VIPにアップグレード',
    zh: '升级至尊 VIP',
    ru: 'Улучшить до VIP',
    th: 'อัปเกรดเป็น VIP',
    vi: 'Nâng cấp lên VIP',
    id: 'Tingkatkan ke VIP',
    ko: 'VIP 업그레이드',
    fr: 'Passer à VIP',
    de: 'Auf VIP upgraden'
  },
  manage_vip_btn: {
    en: 'Manage VIP & Extend Plan',
    my: 'VIP သက်တမ်း တိုးမည်',
    es: 'Administrar VIP',
    ja: 'VIPを管理・延長',
    zh: '管理并续费 VIP',
    ru: 'Управление VIP',
    th: 'จัดการ VIP',
    vi: 'Quản lý VIP',
    id: 'Kelola VIP',
    ko: 'VIP 관리 및 연장',
    fr: 'Gérer VIP',
    de: 'VIP verwalten'
  },

  // Daily Blessing
  daily_blessing_title: {
    en: 'Daily Blessing',
    my: 'နေ့စဉ် အခမဲ့ လက်ဆောင်',
    es: 'Bendición Diaria',
    ja: 'デイリーギフト',
    zh: '每日福利',
    ru: 'Ежедневный Бонус',
    th: 'ของขวัญประจำวัน',
    vi: 'Quà tặng hàng ngày',
    id: 'Hadiah Harian',
    ko: '일일 선물',
    fr: 'Cadeau Quotidien',
    de: 'Täglicher Bonus'
  },
  daily_claim_title: {
    en: 'Claim Daily +25 Energy',
    my: 'နေ့စဉ် စွမ်းအင် +၂၅ အခမဲ့ရယူမည်',
    es: 'Reclamar +25 Energía Diaria',
    ja: '毎日 +25 エネルギーを獲得',
    zh: '领取每日 +25 能量',
    ru: 'Получить +25 Энергии',
    th: 'รับพลังงานฟรี +25 ทุกวัน',
    vi: 'Nhận +25 Năng lượng mỗi ngày',
    id: 'Klaim +25 Energi Harian',
    ko: '매일 +25 에너지 받기',
    fr: 'Réclamer +25 Énergie par jour',
    de: 'Täglich +25 Energie erhalten'
  },
  daily_claim_desc: {
    en: 'Get +25 Starlight Energy free every 24 hours',
    my: '၂၄ နာရီလျှင် တစ်ကြိမ် စွမ်းအင် ၂၅ ခု အခမဲ့ ရယူနိုင်ပါသည်',
    es: 'Obtén +25 de energía gratis cada 24 horas',
    ja: '24時間ごとに25エネルギーを無料で獲得できます',
    zh: '每 24 小时可免费领取 25 点能量',
    ru: 'Получайте 25 энергии бесплатно каждые 24 часа',
    th: 'รับพลังงานฟรี 25 หน่วยทุก 24 ชั่วโมง',
    vi: 'Nhận miễn phí 25 năng lượng mỗi 24 giờ',
    id: 'Dapatkan 25 energi gratis setiap 24 jam',
    ko: '24시간마다 25 에너지를 무료로 받으세요',
    fr: 'Obtenez 25 énergies gratuites toutes les 24 heures',
    de: 'Alle 24 Stunden 25 kostenlose Energie erhalten'
  },
  claimed_next_in: {
    en: 'Claimed ✓ Next in',
    my: 'ရယူပြီးပါပြီ ✓ နောက်ထပ် ရယူနိုင်မည့်အချိန်',
    es: 'Reclamado ✓ Siguiente en',
    ja: '受取済み ✓ 次回まで',
    zh: '已领取 ✓ 距离下次还有',
    ru: 'Получено ✓ Следующий через',
    th: 'รับแล้ว ✓ ครั้งต่อไปใน',
    vi: 'Đã nhận ✓ Lần tiếp theo sau',
    id: 'Diklaim ✓ Berikutnya dalam',
    ko: '수령 완료 ✓ 다음 수령까지',
    fr: 'Réclamé ✓ Prochain dans',
    de: 'Erhalten ✓ Nächste in'
  },

  // Home & Characters
  featured_characters: {
    en: 'Featured Companions',
    my: 'လူကြိုက်အများဆုံး ဇာတ်ကောင်များ',
    es: 'Compañeros Destacados',
    ja: '人気のキャラクター',
    zh: '热门角色',
    ru: 'Популярные Персонажи',
    th: 'ตัวละครยอดนิยม',
    vi: 'Nhân vật nổi bật',
    id: 'Karakter Populer',
    ko: '인기 캐릭터',
    fr: 'Personnages Populaires',
    de: 'Beliebte Charaktere'
  },
  all_characters: {
    en: 'All Characters',
    my: 'ဇာတ်ကောင်အားလုံး',
    es: 'Todos los Personajes',
    ja: 'すべてのキャラクター',
    zh: '全部角色',
    ru: 'Все Персонажи',
    th: 'ตัวละครทั้งหมด',
    vi: 'Tất cả nhân vật',
    id: 'Semua Karakter',
    ko: '전체 캐릭터',
    fr: 'Tous les Personnages',
    de: 'Alle Charaktere'
  },
  quick_actions: {
    en: 'Quick Actions',
    my: 'အမြန် လုပ်ဆောင်ချက်များ',
    es: 'Acciones Rápidas',
    ja: 'クイックアクション',
    zh: '快捷操作',
    ru: 'Быстрые Действия',
    th: 'การดำเนินการด่วน',
    vi: 'Thao tác nhanh',
    id: 'Aksi Cepat',
    ko: '빠른 작업',
    fr: 'Actions Rapides',
    de: 'Schnellaktionen'
  },
  create_custom_character: {
    en: 'Create Custom Character',
    my: 'ဇာတ်ကောင်သစ် ဖန်တီးမည်',
    es: 'Crear Personaje Personalizado',
    ja: 'カスタムキャラ作成',
    zh: '创建自定义角色',
    ru: 'Создать Персонажа',
    th: 'สร้างตัวละครใหม่',
    vi: 'Tạo nhân vật tùy chỉnh',
    id: 'Buat Karakter Baru',
    ko: '커스텀 캐릭터 만들기',
    fr: 'Créer un Personnage',
    de: 'Charakter erstellen'
  },
  design_custom_ai: {
    en: 'Design custom AI bot',
    my: 'စိတ်ကြိုက် AI ဖန်တီးပါ',
    es: 'Diseña tu bot de IA',
    ja: '自分だけのAIを作成',
    zh: '打造专属 AI 角色',
    ru: 'Создайте своего бота',
    th: 'ออกแบบบอทของคุณเอง',
    vi: 'Thiết kế bot của riêng bạn',
    id: 'Desain bot kustom Anda',
    ko: '나만의 AI 봇 디자인',
    fr: 'Concevez votre bot IA',
    de: 'Eigenen KI-Bot entwerfen'
  },
  gems_store: {
    en: 'Gems Store',
    my: 'ပတ္တမြား စတိုးဆိုင်',
    es: 'Tienda de Gemas',
    ja: 'ジェムショップ',
    zh: '宝石商店',
    ru: 'Магазин Гемов',
    th: 'ร้านค้าอัญมณี',
    vi: 'Cửa hàng đá quý',
    id: 'Toko Permata',
    ko: '보석 상점',
    fr: 'Boutique de Gemmes',
    de: 'Edelstein-Shop'
  },
  recharge_orbs: {
    en: 'Recharge Energy & Gems',
    my: 'စွမ်းအင်နှင့် ပတ္တမြား ဖြည့်မည်',
    es: 'Recargar Energía y Gemas',
    ja: 'エネルギーとジェムをチャージ',
    zh: '充值能量与宝石',
    ru: 'Пополнить Энергию',
    th: 'เติมพลังงานและอัญมณี',
    vi: 'Nạp năng lượng và đá quý',
    id: 'Isi Ulang Energi & Permata',
    ko: '에너지 및 보석 충전',
    fr: 'Recharger Énergie et Gemmes',
    de: 'Energie & Edelsteine aufladen'
  },
  empress_vip: {
    en: 'Empress VIP',
    my: 'ဧကရီ VIP အဖွဲ့ဝင်',
    es: 'VIP Empress',
    ja: 'VIP メンバーシップ',
    zh: '至尊 VIP 会员',
    ru: 'VIP Подписка',
    th: 'สมาชิก VIP',
    vi: 'Thành viên VIP',
    id: 'Keanggotaan VIP',
    ko: 'VIP 멤버십',
    fr: 'Membre VIP',
    de: 'VIP-Mitgliedschaft'
  },
  unlimited_pass: {
    en: 'Unlimited Chat Pass',
    my: 'အကန့်အသတ်မဲ့ စကားပြောခွင့်',
    es: 'Pase Ilimitado de Chat',
    ja: 'チャット無制限パス',
    zh: '无限聊天特权',
    ru: 'Безлимитный Чат',
    th: 'แชทได้ไม่จำกัด',
    vi: 'Trò chuyện không giới hạn',
    id: 'Obrolan Tanpa Batas',
    ko: '무제한 대화 이용권',
    fr: 'Pass de Chat Illimité',
    de: 'Unbegrenzter Chat-Pass'
  },
  profile_language_desc: {
    en: 'Persona, Memory & Language',
    my: 'ကိုယ်ရေးအချက်အလက်နှင့် ဘာသာစကား',
    es: 'Perfil, Memoria e Idioma',
    ja: 'プロフィール・記憶・言語',
    zh: '人设、记忆与语言设置',
    ru: 'Профиль, Память и Язык',
    th: 'โปรไฟล์ ความจำ และภาษา',
    vi: 'Hồ sơ, ký ức và ngôn ngữ',
    id: 'Profil, Memori & Bahasa',
    ko: '프로필, 기억 및 언어',
    fr: 'Profil, Mémoire et Langue',
    de: 'Profil, Gedächtnis & Sprache'
  },
  start_chat: {
    en: 'Start Chat',
    my: 'စကားစပြောမည်',
    es: 'Iniciar Chat',
    ja: 'チャット開始',
    zh: '开始聊天',
    ru: 'Начать Чат',
    th: 'เริ่มแชท',
    vi: 'Bắt đầu chat',
    id: 'Mulai Chat',
    ko: '대화 시작',
    fr: 'Démarrer le Chat',
    de: 'Chat Starten'
  },
  resume_chat: {
    en: 'Resume Chat',
    my: 'စကားဆက်ပြောမည်',
    es: 'Continuar Chat',
    ja: 'チャットを再開',
    zh: '继续聊天',
    ru: 'Продолжить Чат',
    th: 'คุยต่อ',
    vi: 'Tiếp tục chat',
    id: 'Lanjutkan Chat',
    ko: '대화 이어하기',
    fr: 'Reprendre le Chat',
    de: 'Chat Fortsetzen'
  },
  search_characters: {
    en: 'Search characters by name, title, or trait...',
    my: 'ဇာတ်ကောင်အမည် (သို့) စရိုက်ဖြင့် ရှာဖွေပါ...',
    es: 'Buscar personajes por nombre o rasgo...',
    ja: '名前や特徴でキャラクターを検索...',
    zh: '按名称或特征搜索角色...',
    ru: 'Поиск персонажей по имени...',
    th: 'ค้นหาตัวละครตามชื่อหรือลักษณะ...',
    vi: 'Tìm kiếm nhân vật theo tên hoặc đặc điểm...',
    id: 'Cari karakter berdasarkan nama atau sifat...',
    ko: '이름 또는 특성으로 캐릭터 검색...',
    fr: 'Rechercher des personnages...',
    de: 'Charaktere suchen...'
  },
  ai_companions_title: {
    en: 'AI Companions',
    my: 'AI ဇာတ်ကောင်များ',
    es: 'Compañeros de IA',
    ja: 'AIキャラクター',
    zh: 'AI 伴侣角色',
    ru: 'ИИ Персонажи',
    th: 'ตัวละคร AI',
    vi: 'Nhân vật AI',
    id: 'Karakter AI',
    ko: 'AI 캐릭터',
    fr: 'Compagnons IA',
    de: 'KI-Charaktere'
  },
  ai_companions_desc: {
    en: 'Pick a character to start your fantasy roleplay journey',
    my: 'စိတ်ကြိုက် ဇာတ်ကောင်ကို ရွေးချယ်၍ စကားစတင် ပြောဆိုနိုင်ပါသည်',
    es: 'Elige un personaje para comenzar tu historia',
    ja: 'キャラクターを選んで会話を始めましょう',
    zh: '选择一个角色开启你的角色扮演奇幻之旅',
    ru: 'Выберите персонажа для начала ролевой игры',
    th: 'เลือกตัวละครเพื่อเริ่มการผจญภัยของคุณ',
    vi: 'Chọn một nhân vật để bắt đầu hành trình của bạn',
    id: 'Pilih karakter untuk memulai obrolan fantasi Anda',
    ko: '캐릭터를 선택하여 롤플레잉을 시작하세요',
    fr: 'Choisissez un personnage pour commencer l\'aventure',
    de: 'Wähle einen Charakter für dein Rollenspiel'
  },

  // Categories
  cat_All: { en: 'All', my: 'အားလုံး', es: 'Todos', ja: 'すべて', zh: '全部', ru: 'Все', th: 'ทั้งหมด', vi: 'Tất cả', id: 'Semua', ko: '전체', fr: 'Tous', de: 'Alle' },
  cat_Anime: { en: 'Anime', my: 'အန်နီမေး', es: 'Anime', ja: 'アニメ', zh: '动漫', ru: 'Аниме', th: 'อนิเมะ', vi: 'Anime', id: 'Anime', ko: '애니메이션', fr: 'Anime', de: 'Anime' },
  cat_Realistic: { en: 'Realistic', my: 'လက်တွေ့', es: 'Realista', ja: 'リアル', zh: '写实', ru: 'Реалистичные', th: 'สมจริง', vi: 'Thực tế', id: 'Realistis', ko: '현실적', fr: 'Réaliste', de: 'Realistisch' },
  cat_SciFi: { en: 'Sci-Fi', my: 'သိပ္ပံ', es: 'Ciencia Ficción', ja: 'SF', zh: '科幻', ru: 'Научная Фантастика', th: 'ไซไฟ', vi: 'Khoa học viễn tưởng', id: 'Sci-Fi', ko: 'SF', fr: 'Science-Fiction', de: 'Sci-Fi' },
  cat_Fantasy: { en: 'Fantasy', my: 'စိတ်ကူးယဉ်', es: 'Fantasía', ja: 'ファンタジー', zh: '奇幻', ru: 'Фэнтези', th: 'แฟนตาซี', vi: 'Giả tưởng', id: 'Fantasi', ko: '판타지', fr: 'Fantastique', de: 'Fantasy' },
  cat_Custom: { en: 'Custom', my: 'စိတ်ကြိုက်', es: 'Personalizado', ja: 'カスタム', zh: '自定义', ru: 'Пользовательские', th: 'กำหนดเอง', vi: 'Tùy chỉnh', id: 'Kustom', ko: '커스텀', fr: 'Personnalisé', de: 'Eigene' },

  // Chat Views
  active_conversations: {
    en: 'Active Conversations',
    my: 'လက်ရှိ စကားပြောနေသော စကားဝိုင်းများ',
    es: 'Conversaciones Activas',
    ja: 'アクティブな会話',
    zh: '活跃对话',
    ru: 'Активные Диалоги',
    th: 'การสนทนาที่ใช้งานอยู่',
    vi: 'Cuộc trò chuyện đang hoạt động',
    id: 'Percakapan Aktif',
    ko: '활성 대화',
    fr: 'Conversations Actives',
    de: 'Aktive Chats'
  },
  chats_on_telegram_desc: {
    en: 'Chats are synced in real-time with Telegram Bot',
    my: 'Telegram Bot နှင့် တိုက်ရိုက် ချိတ်ဆက်ထားသော စကားဝိုင်းများ',
    es: 'Los chats están sincronizados con Telegram Bot',
    ja: 'Telegram Botとリアルタイムで同期中',
    zh: '聊天记录与 Telegram 机器人实时同步',
    ru: 'Чаты синхронизированы с Telegram ботом',
    th: 'แชทซิงค์แบบเรียลไทม์กับ Telegram Bot',
    vi: 'Được đồng bộ theo thời gian thực với Telegram Bot',
    id: 'Obrolan disinkronkan langsung dengan Telegram Bot',
    ko: 'Telegram Bot과 실시간으로 동기화됩니다',
    fr: 'Discussions synchronisées avec Telegram Bot',
    de: 'Chats werden mit dem Telegram Bot synchronisiert'
  },
  no_conversations_yet: {
    en: 'No conversations yet',
    my: 'စကားပြောထားသော မှတ်တမ်း မရှိသေးပါ',
    es: 'Aún no hay conversaciones',
    ja: '会話履歴はまだありません',
    zh: '暂无对话记录',
    ru: 'Пока нет диалогов',
    th: 'ยังไม่มีประวัติการแชท',
    vi: 'Chưa có cuộc trò chuyện nào',
    id: 'Belum ada percakapan',
    ko: '대화 기록이 없습니다',
    fr: 'Aucune discussion pour le moment',
    de: 'Noch keine Chats vorhanden'
  },
  choose_char_to_chat: {
    en: 'Choose a character to start your roleplay fantasy',
    my: 'စကားစတင်ပြောဆိုရန် ဇာတ်ကောင်တစ်ခုကို ရွေးချယ်ပါ',
    es: 'Elige un personaje para comenzar tu historia',
    ja: 'キャラクターを選んでロールプレイを始めましょう',
    zh: '选择一个角色开启角色扮演之旅',
    ru: 'Выберите персонажа для начала общения',
    th: 'เลือกตัวละครเพื่อเริ่มการสนทนา',
    vi: 'Chọn một nhân vật để bắt đầu trò chuyện',
    id: 'Pilih karakter untuk mulai mengobrol',
    ko: '캐릭터를 선택하여 대화를 시작하세요',
    fr: 'Choisissez un personnage pour discuter',
    de: 'Wähle einen Charakter, um zu starten'
  },
  start_first_chat: {
    en: 'Start First Chat',
    my: 'ပထမဆုံး ချက်တင် စတင်မည်',
    es: 'Iniciar Primer Chat',
    ja: '最初のチャットを始める',
    zh: '发起第一次对话',
    ru: 'Начать Первый Чат',
    th: 'เริ่มแชทแรก',
    vi: 'Bắt đầu cuộc trò chuyện đầu tiên',
    id: 'Mulai Obrolan Pertama',
    ko: '첫 대화 시작하기',
    fr: 'Commencer la Première Discussion',
    de: 'Ersten Chat starten'
  },
  select_all: {
    en: 'Select All',
    my: 'အားလုံး ရွေးမည်',
    es: 'Seleccionar Todo',
    ja: 'すべて選択',
    zh: '全选',
    ru: 'Выбрать все',
    th: 'เลือกทั้งหมด',
    vi: 'Chọn tất cả',
    id: 'Pilih Semua',
    ko: '모두 선택',
    fr: 'Tout Sélectionner',
    de: 'Alle Auswählen'
  },
  delete_selected: {
    en: 'Delete Selected',
    my: 'ရွေးထားသည်များ ဖျက်မည်',
    es: 'Eliminar Seleccionados',
    ja: '選択項目を削除',
    zh: '删除所选',
    ru: 'Удалить Выбранное',
    th: 'ลบที่เลือก',
    vi: 'Xóa mục đã chọn',
    id: 'Hapus yang Dipilih',
    ko: '선택 항목 삭제',
    fr: 'Supprimer la Sélection',
    de: 'Ausgewählte löschen'
  },
  chat_placeholder: {
    en: 'Type your message or *actions*...',
    my: 'စာ (သို့) *လှုပ်ရှားမှု* ရိုက်ထည့်ပါ...',
    es: 'Escribe tu mensaje o *acciones*...',
    ja: 'メッセージまたは *行動* を入力...',
    zh: '输入消息或 *动作*...',
    ru: 'Введите сообщение или *действие*...',
    th: 'พิมพ์ข้อความหรือ *การกระทำ*...',
    vi: 'Nhập tin nhắn hoặc *hành động*...',
    id: 'Ketik pesan atau *tindakan*...',
    ko: '메시지 또는 *행동*을 입력하세요...',
    fr: 'Tapez votre message ou *actions*...',
    de: 'Nachricht oder *Aktionen* eingeben...'
  },
  clear_chat: {
    en: 'Clear History',
    my: 'မှတ်တမ်း ဖျက်မည်',
    es: 'Borrar Historial',
    ja: '履歴を消去',
    zh: '清空历史',
    ru: 'Очистить Историю',
    th: 'ล้างประวัติ',
    vi: 'Xóa lịch sử',
    id: 'Hapus Riwayat',
    ko: '기록 삭제',
    fr: 'Effacer l\'historique',
    de: 'Verlauf löschen'
  },

  // Settings Persona & Memory
  user_persona: {
    en: 'Your Persona & Profile',
    my: 'မိမိ၏ အချက်အလက်နှင့် ဇာတ်ကောင်ပုံစံ',
    es: 'Tu Perfil y Persona',
    ja: 'プロフィールとペルソナ',
    zh: '个人人设与资料',
    ru: 'Ваш Профиль и Персона',
    th: 'โปรไฟล์และตัวตนของคุณ',
    vi: 'Hồ sơ và Danh tính',
    id: 'Profil & Persona Anda',
    ko: '사용자 프로필 및 페르소나',
    fr: 'Profil et Persona',
    de: 'Profil & Persona'
  },
  user_persona_desc: {
    en: 'Manage your name, pronouns, backstory, and AI creativity',
    my: 'အမည်၊ ကိုယ်ရေးအကျဉ်းနှင့် AI တီထွင်ဖန်တီးနိုင်စွမ်းကို စိတ်ကြိုက် ပြင်ဆင်ပါ',
    es: 'Configura tu nombre, historia y creatividad de la IA',
    ja: '名前や設定、AIの創造性をカスタマイズ',
    zh: '设置您的名称、背景故事以及 AI 创造力参数',
    ru: 'Настройка имени, предыстории и параметров ИИ',
    th: 'จัดการชื่อ เรื่องราวเบื้องหลัง และความคิดสร้างสรรค์ของ AI',
    vi: 'Quản lý tên, câu chuyện và độ sáng tạo của AI',
    id: 'Kelola nama, latar belakang, dan kreativitas AI',
    ko: '이름, 배경 스토리 및 AI 창의성을 설정하세요',
    fr: 'Gérez votre nom, histoire et la créativité de l\'IA',
    de: 'Verwalte deinen Namen, Hintergrund und KI-Kreativität'
  },
  memory_ledger: {
    en: 'Memory Ledger',
    my: 'မှတ်ဉာဏ် ဘဏ်တိုက်',
    es: 'Registro de Memoria',
    ja: '記憶台帳',
    zh: '记忆账本',
    ru: 'Книга Памяти',
    th: 'สมุดบันทึกความจำ',
    vi: 'Sổ ký ức',
    id: 'Buku Memori',
    ko: '기억 저장소',
    fr: 'Registre de Mémoire',
    de: 'Gedächtnis-Archiv'
  },
  memory_ledger_desc: {
    en: 'Inspect and manage characters’ long-term memories of you',
    my: 'ဇာတ်ကောင်များ သင့်အကြောင်း မှတ်သားထားသော မှတ်ဉာဏ်များကို စစ်ဆေးစီမံပါ',
    es: 'Revisa y gestiona los recuerdos que los personajes tienen de ti',
    ja: 'キャラクターが覚えているあなたに関する記憶を確認・管理',
    zh: '查看和管理角色对您的长期记忆',
    ru: 'Просмотр и управление воспоминаниями персонажей о вас',
    th: 'ตรวจสอบและจัดการความทรงจำระยะยาวของตัวละครเกี่ยวกับคุณ',
    vi: 'Xem và quản lý các ký ức dài hạn của nhân vật về bạn',
    id: 'Periksa dan kelola memori jangka panjang karakter tentang Anda',
    ko: '캐릭터가 기억하는 장기 기억을 확인하고 관리합니다',
    fr: 'Consulter et gérer les souvenirs des personnages',
    de: 'Langzeiterinnerungen der Charaktere an dich verwalten'
  },
  support_feedback: {
    en: 'Support & Help Center',
    my: 'အကူအညီနှင့် ဝန်ဆောင်မှု',
    es: 'Soporte y Ayuda',
    ja: 'サポート・ヘルプ',
    zh: '客服与帮助中心',
    ru: 'Поддержка и Помощь',
    th: 'ศูนย์ช่วยเหลือและสนับสนุน',
    vi: 'Hỗ trợ và Trợ giúp',
    id: 'Bantuan & Dukungan',
    ko: '고객지원 및 도움말',
    fr: 'Support et Aide',
    de: 'Support & Hilfe'
  },
  support_feedback_desc: {
    en: 'Payment assistance, VIP restoration, and bug reports',
    my: 'ငွေပေးချေမှု၊ VIP သက်တမ်းနှင့် အခက်အခဲများအတွက် အကူအညီ ရယူပါ',
    es: 'Asistencia con pagos, VIP y reporte de errores',
    ja: '支払いサポート、VIPの復元、不具合の報告',
    zh: '充值问题、VIP 恢复及问题反馈',
    ru: 'Помощь с оплатой, VIP и сообщения об ошибках',
    th: 'ความช่วยเหลือด้านการชำระเงิน และรายงานปัญหา',
    vi: 'Hỗ trợ thanh toán, khôi phục VIP và báo cáo lỗi',
    id: 'Bantuan pembayaran, pemulihan VIP, dan laporan masalah',
    ko: '결제 지원, VIP 복원 및 오류 제보',
    fr: 'Assistance pour les paiements et signalement de bugs',
    de: 'Zahlungshilfe, VIP-Wiederherstellung und Fehlermeldungen'
  },
  terms_conditions: {
    en: 'Terms & Conditions',
    my: 'ဝန်ဆောင်မှု စည်းမျဉ်းများ',
    es: 'Términos y Condiciones',
    ja: '利用規約',
    zh: '服务条款',
    ru: 'Условия Использования',
    th: 'ข้อกำหนดและเงื่อนไข',
    vi: 'Điều khoản & Điều kiện',
    id: 'Syarat & Ketentuan',
    ko: '이용 약관',
    fr: 'Conditions Générales',
    de: 'Nutzungsbedingungen'
  },
  terms_conditions_desc: {
    en: 'Read terms of service and usage rules',
    my: 'ဝန်ဆောင်မှု စည်းမျဉ်းများကို ဖတ်ရှုပါ',
    es: 'Lee los términos de servicio y reglas de uso',
    ja: '利用規約と利用ルールを読む',
    zh: '阅读服务条款和使用规则',
    ru: 'Ознакомьтесь с условиями использования',
    th: 'อ่านข้อกำหนดและเงื่อนไขการใช้งาน',
    vi: 'Đọc các điều khoản và quy định sử dụng',
    id: 'Baca syarat layanan dan aturan penggunaan',
    ko: '서비스 이용약관 및 규칙을 읽어보세요',
    fr: 'Lire les conditions d\'utilisation et règles',
    de: 'Nutzungsbedingungen und Regeln lesen'
  },
  privacy_policy: {
    en: 'Privacy Policy',
    my: 'ကိုယ်ရေးအချက်အလက် မူဝါဒ',
    es: 'Política de Privacidad',
    ja: 'プライバシーポリシー',
    zh: '隐私政策',
    ru: 'Политика Конфиденциальности',
    th: 'นโยบายความเป็นส่วนตัว',
    vi: 'Chính sách bảo mật',
    id: 'Kebijakan Privasi',
    ko: '개인정보 처리방침',
    fr: 'Politique de Confidentialité',
    de: 'Datenschutzerklärung'
  },
  privacy_policy_desc: {
    en: 'Security and data privacy protection policy',
    my: 'လုံခြုံရေးနှင့် ဒေတာ ကိုင်တွယ်မှု မူဝါဒ',
    es: 'Política de seguridad y protección de datos',
    ja: 'セキュリティと個人情報保護方針',
    zh: '安全与个人隐私数据保护政策',
    ru: 'Политика безопасности и защиты данных',
    th: 'ความปลอดภัยและนโยบายความเป็นส่วนตัวของข้อมูล',
    vi: 'Chính sách bảo mật và an toàn dữ liệu cá nhân',
    id: 'Kebijakan keamanan dan privasi data',
    ko: '보안 및 개인정보 보호정책',
    fr: 'Sécurité et politique de protection des données',
    de: 'Sicherheits- und Datenschutzrichtlinie'
  },
  policy_18plus: {
    en: '18+ Adult Policy',
    my: '၁၈+ လူကြီးသီးသန့် မူဝါဒ',
    es: 'Política para Mayores de 18',
    ja: '18歳以上利用規程',
    zh: '18+ 成人内容政策',
    ru: 'Правила 18+',
    th: 'นโยบาย 18+ สำหรับผู้ใหญ่',
    vi: 'Chính sách 18+',
    id: 'Kebijakan 18+ Dewasa',
    ko: '18+ 성인 정책',
    fr: 'Politique 18+ Adulte',
    de: '18+ Richtlinie'
  },
  policy_18plus_desc: {
    en: '18+ adult content and safety guidelines',
    my: 'လူကြီးသီးသန့် အသုံးပြုမှု လမ်းညွှန်ချက်များ',
    es: 'Pautas de seguridad y contenido para adultos (+18)',
    ja: '18歳以上向け成人向けコンテンツガイドライン',
    zh: '18+ 成人内容及安全使用指南',
    ru: 'Правила контента и безопасности для взрослых 18+',
    th: 'แนวทางความปลอดภัยและเนื้อหาสำหรับผู้ใหญ่ 18+',
    vi: 'Hướng dẫn an toàn và nội dung cho người trên 18 tuổi',
    id: 'Panduan keamanan dan konten dewasa 18+',
    ko: '18+ 성인 전용 콘텐츠 및 안전 가이드라인',
    fr: 'Directives sur les contenus 18+ et sécurité',
    de: '18+ Richtlinien und Sicherheitsregeln'
  },
  tap_to_open: {
    en: 'Tap to configure ›',
    my: 'ဖွင့်ရန် နှိပ်ပါ ›',
    es: 'Toca para abrir ›',
    ja: 'タップして開く ›',
    zh: '点击配置 ›',
    ru: 'Нажмите, чтобы открыть ›',
    th: 'แตะเพื่อเปิด ›',
    vi: 'Chạm để mở ›',
    id: 'Ketuk untuk membuka ›',
    ko: '탭하여 열기 ›',
    fr: 'Appuyez pour ouvrir ›',
    de: 'Tippen zum Öffnen ›'
  },
  save_changes: {
    en: 'Save & Apply',
    my: 'အပြောင်းအလဲများ သိမ်းဆည်းမည်',
    es: 'Guardar y Aplicar',
    ja: '保存して適用',
    zh: '保存并应用',
    ru: 'Сохранить',
    th: 'บันทึกและนำไปใช้',
    vi: 'Lưu & Áp dụng',
    id: 'Simpan & Terapkan',
    ko: '저장 및 적용',
    fr: 'Enregistrer et Appliquer',
    de: 'Speichern & Anwenden'
  },
  days_left: {
    en: 'days left',
    my: 'ရက်ကျန်ရှိ',
    es: 'días restantes',
    ja: '日残り',
    zh: '天剩余',
    ru: 'дней осталось',
    th: 'วันคงเหลือ',
    vi: 'ngày còn lại',
    id: 'hari tersisa',
    ko: '일 남음',
    fr: 'jours restants',
    de: 'Tage übrig'
  },
  task_invite_title: {
    en: 'Invite Friends (+25 Energy)',
    my: 'သူငယ်ချင်းဖိတ်ခေါ်ရန် (+၂၅ စွမ်းအင်)',
    es: 'Invitar Amigos (+25 Energía)',
    ja: '友達を招待 (+25 エネルギー)',
    zh: '邀请好友 (+25 能量)',
    ru: 'Пригласить друзей (+25)',
    th: 'ชวนเพื่อน (+25 พลังงาน)',
    vi: 'Mời bạn bè (+25 Năng lượng)',
    id: 'Undang Teman (+25 Energi)',
    ko: '친구 초대 (+25 에너지)',
    fr: 'Inviter des amis (+25 Énergie)',
    de: 'Freunde einladen (+25 Energie)'
  },
  task_invite_desc: {
    en: 'Earn +25 Energy per friend when they join and send their first message',
    my: 'ဖိတ်ခေါ်ထားသော သူငယ်ချင်းမှ bot တွင် စကားစတင်ပြောဆိုပါက စွမ်းအင် +၂၅ ရရှိမည်ဖြစ်ပါသည်',
    es: 'Gana +25 de energía por cada amigo cuando envíe su primer mensaje',
    ja: '招待した友達が最初のメッセージを送信すると +25 エネルギーを獲得',
    zh: '好友加入并发送首条消息即可获得 +25 能量',
    ru: 'Получите +25 энергии, когда друг напишет первое сообщение',
    th: 'รับ +25 พลังงานเมื่อเพื่อนเข้าร่วมและส่งข้อความแรก',
    vi: 'Nhận +25 năng lượng khi bạn bè tham gia và gửi tin nhắn đầu tiên',
    id: 'Dapatkan +25 energi saat teman bergabung dan mengirim pesan pertama',
    ko: '친구가 참여하여 첫 메시지를 보내면 +25 에너지 획득',
    fr: 'Gagnez +25 d\'énergie dès que votre ami envoie son premier message',
    de: 'Erhalten Sie +25 Energie, wenn Ihr Freund die erste Nachricht sendet'
  },
  invite_now_btn: {
    en: 'Invite Link',
    my: 'လင့်ခ်ယူမည်',
    es: 'Invitar',
    ja: '招待する',
    zh: '立即邀请',
    ru: 'Пригласить',
    th: 'เชิญทันที',
    vi: 'Mời ngay',
    id: 'Undang',
    ko: '초대하기',
    fr: 'Inviter',
    de: 'Einladen'
  },
  invite_link_copied: {
    en: 'Invite link copied to clipboard!',
    my: 'ဖိတ်ခေါ်လင့်ခ်ကို ကူးယူပြီးပါပြီ!',
    es: '¡Enlace de invitación copiado!',
    ja: '招待リンクをコピーしました！',
    zh: '邀请链接已复制！',
    ru: 'Ссылка скопирована!',
    th: 'คัดลอกลิงก์เชิญแล้ว!',
    vi: 'Đã sao chép liên kết mời!',
    id: 'Tautan undangan disalin!',
    ko: '초대 링크가 복사되었습니다!',
    fr: 'Lien d\'invitation copié !',
    de: 'Einladungslink kopiert!'
  },
  pin_chat: {
    en: 'Pin Chat',
    my: 'Pin ထောက်ထားမည်',
    es: 'Fijar chat',
    ja: 'ピン留め',
    zh: '置顶对话',
    ru: 'Закрепить',
    th: 'ปักหมุด',
    vi: 'Ghim trò chuyện',
    id: 'Sematkan',
    ko: '고정하기',
    fr: 'Épingler',
    de: 'Anheften'
  },
  unpin_chat: {
    en: 'Unpin Chat',
    my: 'Pin ဖြုတ်မည်',
    es: 'Desfijar chat',
    ja: 'ピン留め解除',
    zh: '取消置顶',
    ru: 'Открепить',
    th: 'ยกเลิกปักหมุด',
    vi: 'Bỏ ghim',
    id: 'Lepas sematan',
    ko: '고정 해제',
    fr: 'Détacher',
    de: 'Lösen'
  },
  pinned_tag: {
    en: 'Pinned',
    my: 'Pin ထောက်ထားသည်',
    es: 'Fijado',
    ja: 'ピン留め済',
    zh: '已置顶',
    ru: 'Закреплено',
    th: 'ปักหมุดแล้ว',
    vi: 'Đã ghim',
    id: 'Disematkan',
    ko: '고정됨',
    fr: 'Épinglé',
    de: 'Angeheftet'
  },
  chat_limit_notice: {
    en: 'Max 5 unpinned active conversations. Oldest unpinned chats are auto-cleaned.',
    my: 'Pin မထောက်ထားသော စကားဝိုင်း ၅ ယောက်အထိသာ ကန့်သတ်ထားပြီး ကျော်လွန်ပါက အဟောင်းများကို အလိုအလျောက် ရှင်းလင်းပေးပါမည်။',
    es: 'Máx. 5 chats activos no fijados. Los más antiguos se limpian automáticamente.',
    ja: 'ピン留めされていないチャットは最大5名まで。古いチャットは自動整理されます。',
    zh: '未置顶对话上限为5人，超出将自动清理最旧的对话。',
    ru: 'Максимум 5 незакрепленных диалогов. Старые очищаются автоматически.',
    th: 'จำกัดแชทไม่ปักหมุด 5 คน แชทเก่าจะถูกล้างอัตโนมัติ',
    vi: 'Tối đa 5 cuộc trò chuyện chưa ghim. Các đoạn chat cũ sẽ tự động được dọn dẹp.',
    id: 'Maks 5 obrolan tanpa pin. Obrolan lama otomatis dibersihkan.',
    ko: '고정되지 않은 대화는 최대 5개까지 유지되며 오래된 대화는 자동 정리됩니다.',
    fr: 'Max 5 conversations non épinglées. Les plus anciennes sont nettoyées.',
    de: 'Max. 5 nicht angeheftete Chats. Ältere werden automatisch bereinigt.'
  }
};

export function t(key: string, lang?: string | null): string {
  const resolved = resolveLanguage(lang);
  const entry = translations[key];
  if (!entry) return key;
  return entry[resolved] || entry['my'] || entry['en'] || key;
}

export function getLanguageName(code: SupportedLanguage): string {
  const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return found ? found.nativeName : code;
}
