/**
 * MovieDar design note — «Тёмная кинематека»: poster-first content discovery,
 * black-plum surfaces, porcelain type and the signature violet #8577f0.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CirclePlay,
  Clapperboard,
  Heart,
  Menu,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ContentType = "movie" | "series" | "anime";
type AuthMode = "login" | "signup";
type Language = "ru" | "en";

type Title = {
  id: number;
  type: ContentType;
  title: string;
  poster: string;
  year: string;
  rating: number;
  genres: string[];
  overview: string;
  runtime: number | null;
  episodes: number | null;
  trailer_yt?: string;
  tagline?: string;
  crew?: string[];
  crew_label?: string;
};

type StoredAccount = { passwordDigest: string; createdAt: string };

const typeLabels: Record<Language, Record<ContentType, string>> = {
  ru: { movie: "Фильмы", series: "Сериалы", anime: "Аниме" },
  en: { movie: "Movies", series: "Series", anime: "Anime" },
};

const typeFilters = (language: Language): Array<{ key: ContentType | "all"; label: string }> => [
  { key: "all", label: language === "ru" ? "Всё" : "All" },
  { key: "movie", label: typeLabels[language].movie },
  { key: "series", label: typeLabels[language].series },
  { key: "anime", label: typeLabels[language].anime },
];

const translations = {
  ru: {
    languageSwitch: "Сменить язык",
    home: "Главная", signIn: "Войти", signOut: "Выйти из аккаунта", createAccount: "Создать аккаунт",
    openSearch: "Открыть поиск", openMenu: "Открыть меню", mainNavigation: "Основная навигация", mobileNavigation: "Мобильная навигация",
    heroKicker: "Твоя кинематека на вечер", heroStart: "Истории, которые", heroEmphasis: "остаются", heroEnd: "после титров.",
    heroLede: "Фильмы, сериалы и аниме — в одном месте. Ищи по настроению, сохраняй в очередь, возвращайся к лучшему.",
    searchPlaceholder: "Название, жанр или год...", searchLabel: "Поиск по каталогу", searchStory: "Искать историю",
    titleCount: (count: number | string) => `${count} тайтлов`, worlds: "3 мира контента", noAds: "0 рекламы", issue: "Выпуск #01 · август 2026",
    communityPick: "Выбор сообщества · плёнка недели", inFocus: "Сейчас в фокусе", allCatalog: "Весь каталог",
    curated: "Кураторская подборка", editorialStart: "Потеряй счёт времени.", editorialEmphasis: "Найди свою историю.",
    editorialCopy: "От тихих аниме-путешествий до сериалов, которые невозможно поставить на паузу.", watchAnime: "Смотреть аниме",
    catalogSummary: (found: number, total: number) => `${found} из ${total} тайтлов · архив после титров`, catalogTitle: "Истории для будущих вечеров",
    inFavorites: (count: number) => `В избранном ${count}`, archiveFilm: "Плёнка архива", chooseFormat: "Выбрать формат",
    filterNote: "Отмечай истории на потом: избранное живёт в этом браузере и возвращается вместе с твоим логином.", searchArchive: "Найти историю в архиве",
    allFormats: "Все форматы", loading: "Загружаем тайтлы…", loadMore: "Показать ещё", curatorPick: "ВЫБОР КУРАТОРА",
    notFoundTitle: "Эта сцена ещё не найдена", notFoundCopy: "Смените название, год или настроение — архив помнит больше.", returnArchive: "Вернуть весь архив",
    personalCinema: "Твоя личная кинематека", footerCopy: "Кинематека для знакомства с фильмами, сериалами и аниме. Полные версии здесь не размещаются — остаются только истории, к которым хочется вернуться.", toCatalog: "К каталогу",
    accountKicker: "Личная кинематека", loginTitle: "С возвращением.", signupTitle: "Сохрани свои истории.",
    loginDescription: "Войди, чтобы продолжить собирать избранное под своим именем.", signupDescription: "Аккаунт хранится только в этом браузере — без Firebase и сторонних сервисов.",
    username: "Логин", password: "Пароль", usernameHint: "например, movielover", passwordHint: "минимум 4 символа", loginMovieDar: "Войти в MovieDar", createMovieDar: "Создать аккаунт",
    noAccount: "Нет аккаунта? Создать", hasAccount: "Уже есть аккаунт? Войти", authValidation: "Логин — от 3 символов, пароль — от 4 символов.", usernameTaken: "Такой логин уже занят.", accountCreated: "Аккаунт создан. Добро пожаловать в MovieDar.", credentialsError: "Проверьте логин и пароль.", welcomeBack: "Вы снова в своей кинематеке.", loggedOut: "Вы вышли из аккаунта.",
    favoriteAdded: "Добавлено в избранное", favoriteRemoved: "Убрано из избранного", addFavorite: "Добавить в избранное", removeFavorite: "Убрать из избранного", favorite: "В избранное", savedFavorite: "В избранном",
    noTrailer: "Для этого тайтла пока нет трейлера.", openTitle: "Открыть", poster: "Постер", officialTrailer: "Официальный трейлер", formatTba: "Формат уточняется", minutes: "мин.", episodes: "эп.", author: "Автор", catalogLoadError: "Не удалось загрузить каталог. Обновите страницу.",
  },
  en: {
    languageSwitch: "Change language",
    home: "Home", signIn: "Sign in", signOut: "Sign out", createAccount: "Create account",
    openSearch: "Open search", openMenu: "Open menu", mainNavigation: "Main navigation", mobileNavigation: "Mobile navigation",
    heroKicker: "Your cinema library for tonight", heroStart: "Stories that", heroEmphasis: "stay", heroEnd: "after the credits.",
    heroLede: "Movies, series and anime in one place. Browse by mood, save your queue, and return to the stories worth keeping.",
    searchPlaceholder: "Title, genre or year...", searchLabel: "Search the catalog", searchStory: "Find a story",
    titleCount: (count: number | string) => `${count} titles`, worlds: "3 worlds of stories", noAds: "0 ads", issue: "Issue #01 · August 2026",
    communityPick: "Community pick · reel of the week", inFocus: "In focus now", allCatalog: "Full catalog",
    curated: "Curator's selection", editorialStart: "Lose track of time.", editorialEmphasis: "Find your story.",
    editorialCopy: "From quiet anime journeys to series that are impossible to pause.", watchAnime: "Explore anime",
    catalogSummary: (found: number, total: number) => `${found} of ${total} titles · archive after the credits`, catalogTitle: "Stories for future evenings",
    inFavorites: (count: number) => `${count} saved`, archiveFilm: "Archive reel", chooseFormat: "Choose a format",
    filterNote: "Mark stories for later: your saved list lives in this browser and returns with your login.", searchArchive: "Find a story in the archive",
    allFormats: "All formats", loading: "Loading titles…", loadMore: "Show more", curatorPick: "CURATOR'S PICK",
    notFoundTitle: "That scene is still missing", notFoundCopy: "Try another title, year or mood — the archive remembers more.", returnArchive: "Return to the full archive",
    personalCinema: "Your personal cinema library", footerCopy: "A cinema library for discovering movies, series and anime. Full versions are not hosted here — only stories worth returning to.", toCatalog: "Browse catalog",
    accountKicker: "Personal cinema library", loginTitle: "Welcome back.", signupTitle: "Save the stories you love.",
    loginDescription: "Sign in to keep curating your saved list under your name.", signupDescription: "Your account stays only in this browser — no Firebase or third-party services.",
    username: "Username", password: "Password", usernameHint: "for example, movielover", passwordHint: "at least 4 characters", loginMovieDar: "Sign in to MovieDar", createMovieDar: "Create account",
    noAccount: "No account? Create one", hasAccount: "Already have an account? Sign in", authValidation: "Username needs 3 characters and password needs 4.", usernameTaken: "That username is already taken.", accountCreated: "Your account is ready. Welcome to MovieDar.", credentialsError: "Check your username and password.", welcomeBack: "You are back in your cinema library.", loggedOut: "You have signed out.",
    favoriteAdded: "Added to saved", favoriteRemoved: "Removed from saved", addFavorite: "Add to saved", removeFavorite: "Remove from saved", favorite: "Save for later", savedFavorite: "Saved",
    noTrailer: "No trailer is available for this title yet.", openTitle: "Open", poster: "Poster", officialTrailer: "Official trailer", formatTba: "Format to be confirmed", minutes: "min", episodes: "eps", author: "Creator", catalogLoadError: "We couldn't load the catalog. Refresh the page.",
  },
};

const posterFallback =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='750' viewBox='0 0 500 750'%3E%3Crect width='500' height='750' fill='%2314131d'/%3E%3Cpath d='M140 260h220v230H140z' fill='none' stroke='%238577f0' stroke-width='10'/%3E%3Cpath d='m215 325 105 50-105 50z' fill='%23f1ead9'/%3E%3C/svg%3E";

function accountKey() {
  return "moviedar:accounts";
}

function favoriteKey(username: string | null) {
  return `moviedar:favorites:${username || "guest"}`;
}

async function digestPassword(value: string) {
  const encoded = new TextEncoder().encode(value);
  const bytes = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function ratingTone(rating: number) {
  if (rating >= 8.2) return "rating-good";
  if (rating >= 7) return "rating-mid";
  return "rating-low";
}

export default function Home() {
  const [catalog, setCatalog] = useState<Title[]>([]);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<ContentType | "all">("all");
  const [visibleCount, setVisibleCount] = useState(24);
  const [selected, setSelected] = useState<Title | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [user, setUser] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [mobileNav, setMobileNav] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("moviedar:language") === "en" ? "en" : "ru"));
  const t = translations[language];
  const labels = typeLabels[language];

  useEffect(() => {
    localStorage.setItem("moviedar:language", language);
    document.documentElement.lang = language;
    document.title = language === "ru" ? "MovieDar — фильмы, сериалы и аниме" : "MovieDar — movies, series & anime";
  }, [language]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/catalog.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Catalog could not be loaded");
        return response.json();
      })
      .then((titles: Title[]) => setCatalog(titles))
      .catch(() => toast.error(translations[localStorage.getItem("moviedar:language") === "en" ? "en" : "ru"].catalogLoadError));

    const savedUser = localStorage.getItem("moviedar:session");
    setUser(savedUser || null);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(favoriteKey(user));
    try {
      setFavorites(new Set(raw ? JSON.parse(raw) : []));
    } catch {
      setFavorites(new Set());
    }
  }, [user]);

  const normalizedQuery = query.trim().toLocaleLowerCase(language === "ru" ? "ru-RU" : "en-US");
  const filteredCatalog = useMemo(
    () =>
      catalog.filter((item) => {
        const matchesType = activeType === "all" || item.type === activeType;
        const searchable = `${item.title} ${item.genres.join(" ")} ${item.year}`.toLowerCase();
        return matchesType && (!normalizedQuery || searchable.includes(normalizedQuery));
      }),
    [activeType, catalog, normalizedQuery],
  );

  const highlights = useMemo(
    () => [...catalog].sort((a, b) => b.rating - a.rating).slice(0, 14),
    [catalog],
  );
  const freshPicks = useMemo(() => catalog.slice(14, 28), [catalog]);
  const marqueeRows = useMemo(
    () => [catalog.slice(0, 12), catalog.slice(12, 24), catalog.slice(24, 36)],
    [catalog],
  );
  const favoriteTitles = useMemo(
    () => catalog.filter((item) => favorites.has(item.id)),
    [catalog, favorites],
  );

  function scrollToCatalog(nextType: ContentType | "all" = "all") {
    setActiveType(nextType);
    setVisibleCount(24);
    setMobileNav(false);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthForm({ username: "", password: "" });
    setAuthOpen(true);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = authForm.username.trim();
    if (username.length < 3 || authForm.password.length < 4) {
      toast.error(t.authValidation);
      return;
    }

    const stored = localStorage.getItem(accountKey());
    const accounts: Record<string, StoredAccount> = stored ? JSON.parse(stored) : {};
    const passwordDigest = await digestPassword(authForm.password);

    if (authMode === "signup") {
      if (accounts[username]) {
        toast.error(t.usernameTaken);
        return;
      }
      accounts[username] = { passwordDigest, createdAt: new Date().toISOString() };
      localStorage.setItem(accountKey(), JSON.stringify(accounts));
      toast.success(t.accountCreated);
    } else if (!accounts[username] || accounts[username].passwordDigest !== passwordDigest) {
      toast.error(t.credentialsError);
      return;
    } else {
      toast.success(t.welcomeBack);
    }

    localStorage.setItem("moviedar:session", username);
    setUser(username);
    setAuthOpen(false);
  }

  function logout() {
    localStorage.removeItem("moviedar:session");
    setUser(null);
    toast.message(t.loggedOut);
  }

  function toggleFavorite(id: number) {
    const next = new Set(favorites);
    const isAdding = !next.has(id);
    if (isAdding) next.add(id);
    else next.delete(id);
    setFavorites(next);
    localStorage.setItem(favoriteKey(user), JSON.stringify(Array.from(next)));
    toast.success(isAdding ? t.favoriteAdded : t.favoriteRemoved);
  }

  function openTrailer(title: Title) {
    if (!title.trailer_yt) {
      toast.message(t.noTrailer);
      return;
    }
    window.open(`https://www.youtube.com/watch?v=${title.trailer_yt}`, "_blank", "noopener,noreferrer");
  }

  const renderCard = (item: Title, compact = false) => (
    <article className={`movie-card ${compact ? "movie-card-compact" : ""}`} key={item.id}>
      <button
        type="button"
        className="movie-card-hitbox"
        onClick={() => setSelected(item)}
        aria-label={`${t.openTitle}: ${item.title}`}
      >
        <img
          src={item.poster}
          alt={`${t.poster}: ${item.title}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.src = posterFallback;
          }}
        />
        <span className="movie-scrim" />
        <span className={`rating-ring ${ratingTone(item.rating)}`}>{item.rating.toFixed(1)}</span>
        <span className="movie-card-copy">
          <span className="movie-card-title">{item.title}</span>
          <span className="movie-card-meta">{item.year} · {labels[item.type]}</span>
        </span>
      </button>
      <button
        type="button"
        className={`favorite-toggle ${favorites.has(item.id) ? "favorite-toggle-active" : ""}`}
        onClick={() => toggleFavorite(item.id)}
        aria-label={favorites.has(item.id) ? t.removeFavorite : t.addFavorite}
      >
        <Heart size={16} fill={favorites.has(item.id) ? "currentColor" : "none"} />
      </button>
    </article>
  );

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="MovieDar — home">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-wordmark">Movie<span>Dar</span></span>
        </a>

        <nav className="desktop-nav" aria-label={t.mainNavigation}>
          <button type="button" onClick={() => document.getElementById("home")?.scrollIntoView({ behavior: "smooth" })}>{t.home}</button>
          <button type="button" onClick={() => scrollToCatalog("movie")}>{labels.movie}</button>
          <button type="button" onClick={() => scrollToCatalog("series")}>{labels.series}</button>
          <button type="button" onClick={() => scrollToCatalog("anime")}>{labels.anime}</button>
        </nav>

        <div className="topbar-actions">
          <button type="button" className="icon-action" onClick={() => scrollToCatalog("all")} aria-label={t.openSearch}>
            <Search size={19} />
          </button>
          <div className="language-switch" role="group" aria-label={t.languageSwitch}>
            <button type="button" className={language === "ru" ? "language-active" : ""} onClick={() => setLanguage("ru")} aria-pressed={language === "ru"}>RU</button>
            <button type="button" className={language === "en" ? "language-active" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
          </div>
          {user ? (
            <button type="button" className="user-chip" onClick={logout} title={t.signOut}>
              <span>{user.slice(0, 1).toUpperCase()}</span>
              <b>{user}</b>
            </button>
          ) : (
            <button type="button" className="signin-button" onClick={() => openAuth("login")}>{t.signIn}</button>
          )}
          <button type="button" className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label={t.openMenu}>
            {mobileNav ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileNav && (
        <nav className="mobile-nav" aria-label={t.mobileNavigation}>
          <button type="button" onClick={() => document.getElementById("home")?.scrollIntoView({ behavior: "smooth" })}>{t.home}</button>
          <button type="button" onClick={() => scrollToCatalog("movie")}>{labels.movie}</button>
          <button type="button" onClick={() => scrollToCatalog("series")}>{labels.series}</button>
          <button type="button" onClick={() => scrollToCatalog("anime")}>{labels.anime}</button>
          {!user && <button type="button" onClick={() => openAuth("signup")}>{t.createAccount}</button>}
        </nav>
      )}

      <section className="hero" id="home">
        <div className="hero-art" />
        <div className="marquee-field" aria-hidden="true">
          {marqueeRows.map((row, rowIndex) => (
            <div className={`marquee-row marquee-row-${rowIndex + 1}`} key={rowIndex}>
              {[...row, ...row].map((item, index) => (
                <div className="marquee-poster" key={`${item.id}-${index}`}>
                  <img src={item.poster} alt="" loading="lazy" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="hero-layer" />
        <div className="hero-content">
          <p className="eyebrow"><Sparkles size={15} /> {t.heroKicker}</p>
          <h1>{t.heroStart} <em>{t.heroEmphasis}</em> {t.heroEnd}</h1>
          <p className="hero-lede">{t.heroLede}</p>
          <div className="hero-search">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveType("all");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") scrollToCatalog("all");
              }}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchLabel}
            />
            <button type="button" onClick={() => scrollToCatalog("all")}>{t.searchStory} <ArrowRight size={17} /></button>
          </div>
          <div className="hero-statline">
            <span><strong>{catalog.length || "126"}</strong> {t.titleCount("")}</span>
            <span>{t.worlds}</span>
            <span>{t.noAds}</span>
          </div>
        </div>
        <div className="hero-reel-note"><Clapperboard size={16} /> {t.issue}</div>
      </section>

      <section className="content-section section-with-rails" aria-labelledby="picks-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.communityPick}</p>
            <h2 id="picks-title">{t.inFocus}</h2>
          </div>
          <button className="text-link" type="button" onClick={() => scrollToCatalog("all")}>{t.allCatalog} <ChevronRight size={17} /></button>
        </div>
        <div className="poster-rail">{highlights.map((item) => renderCard(item, true))}</div>
      </section>

      <section className="editorial-strip">
        <div className="editorial-copy">
          <p className="eyebrow">{t.curated}</p>
          <h2>{t.editorialStart}<br /><em>{t.editorialEmphasis}</em></h2>
          <p>{t.editorialCopy}</p>
          <button type="button" className="outline-button" onClick={() => scrollToCatalog("anime")}>{t.watchAnime} <ArrowRight size={17} /></button>
        </div>
        <div className="editorial-collage" aria-hidden="true">
          {freshPicks.slice(0, 4).map((item, index) => <img key={item.id} className={`collage-${index + 1}`} src={item.poster} alt="" referrerPolicy="no-referrer" />)}
        </div>
      </section>

      <section className="content-section catalog-section" id="catalog" aria-labelledby="catalog-title">
        <div className="section-heading catalog-heading">
          <div>
            <p className="eyebrow">{t.catalogSummary(filteredCatalog.length, catalog.length)}</p>
            <h2 id="catalog-title">{t.catalogTitle}</h2>
          </div>
          {favoriteTitles.length > 0 && <button type="button" className="favorites-status" onClick={() => setActiveType("all")}><Heart size={15} fill="currentColor" /> {t.inFavorites(favoriteTitles.length)}</button>}
        </div>

        <div className="catalog-layout">
          <aside className="filter-panel">
            <div className="filter-title"><SlidersHorizontal size={16} /> {t.archiveFilm}</div>
            <p>{t.chooseFormat}</p>
            <div className="filter-options">
              {typeFilters(language).map((filter) => (
                <button
                  type="button"
                  className={activeType === filter.key ? "filter-active" : ""}
                  onClick={() => {
                    setActiveType(filter.key);
                    setVisibleCount(24);
                  }}
                  key={filter.key}
                >
                  {filter.label}
                  {activeType === filter.key && <Check size={14} />}
                </button>
              ))}
            </div>
            <div className="filter-note">{t.filterNote}</div>
          </aside>

          <div className="catalog-main">
            <div className="catalog-toolbar">
              <label>
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchArchive} />
              </label>
              <span>{activeType === "all" ? t.allFormats : labels[activeType]}</span>
            </div>
            {catalog.length === 0 ? (
              <div className="catalog-loading">{t.loading}</div>
            ) : filteredCatalog.length ? (
              <>
                <div className="catalog-grid">{filteredCatalog.slice(0, visibleCount).map((item) => renderCard(item))}</div>
                {visibleCount < filteredCatalog.length && (
                  <button className="load-more" type="button" onClick={() => setVisibleCount((count) => count + 24)}>{t.loadMore} <span>({filteredCatalog.length - visibleCount})</span></button>
                )}
              </>
            ) : (
              <div className="empty-state"><Search size={28} /><h3>{t.notFoundTitle}</h3><p>{t.notFoundCopy}</p><button type="button" onClick={() => setQuery("")}>{t.returnArchive}</button></div>
            )}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div><strong>MovieDar</strong><span>{t.personalCinema}</span></div>
        </div>
        <p>{t.footerCopy}</p>
        <button type="button" onClick={() => scrollToCatalog("all")}>{t.toCatalog} <ArrowRight size={16} /></button>
      </footer>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="auth-dialog">
          <div className="auth-art" />
          <div className="auth-body">
            <DialogHeader>
              <p className="eyebrow">{t.accountKicker}</p>
              <DialogTitle>{authMode === "login" ? t.loginTitle : t.signupTitle}</DialogTitle>
              <DialogDescription>{authMode === "login" ? t.loginDescription : t.signupDescription}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAuth} className="auth-form">
              <label>{t.username}<input value={authForm.username} autoComplete="username" onChange={(event) => setAuthForm((value) => ({ ...value, username: event.target.value }))} placeholder={t.usernameHint} /></label>
              <label>{t.password}<input type="password" value={authForm.password} autoComplete={authMode === "login" ? "current-password" : "new-password"} onChange={(event) => setAuthForm((value) => ({ ...value, password: event.target.value }))} placeholder={t.passwordHint} /></label>
              <button className="auth-submit" type="submit">{authMode === "login" ? t.loginMovieDar : t.createMovieDar} <ArrowRight size={17} /></button>
            </form>
            <button type="button" className="auth-switch" onClick={() => setAuthMode((mode) => (mode === "login" ? "signup" : "login"))}>{authMode === "login" ? t.noAccount : t.hasAccount}</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="detail-dialog">
            <div className="detail-backdrop" />
            <div className="detail-content">
              <img className="detail-poster" src={selected.poster} alt={`${t.poster}: ${selected.title}`} referrerPolicy="no-referrer" />
              <div className="detail-copy">
                <div className="detail-topline"><span>{labels[selected.type]}</span><span>{selected.year}</span><span className={`rating-ring ${ratingTone(selected.rating)}`}>{selected.rating.toFixed(1)}</span></div>
                <DialogTitle>{selected.title}</DialogTitle>
                {selected.tagline && <p className="tagline">{selected.tagline}</p>}
                <div className="genre-line">{selected.genres.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}</div>
                <DialogDescription>{selected.overview}</DialogDescription>
                <p className="detail-facts">{selected.runtime ? `${selected.runtime} ${t.minutes}` : selected.episodes ? `${selected.episodes} ${t.episodes}` : t.formatTba}{selected.crew?.[0] ? ` · ${selected.crew_label || t.author}: ${selected.crew[0]}` : ""}</p>
                <div className="detail-actions">
                  <button type="button" className="watch-trailer" onClick={() => openTrailer(selected)}><Play size={17} fill="currentColor" /> {t.officialTrailer}</button>
                  <button type="button" className="detail-favorite" onClick={() => toggleFavorite(selected.id)}><Heart size={17} fill={favorites.has(selected.id) ? "currentColor" : "none"} /> {favorites.has(selected.id) ? t.savedFavorite : t.favorite}</button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}
