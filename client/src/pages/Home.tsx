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

const typeLabels: Record<ContentType, string> = {
  movie: "Фильмы",
  series: "Сериалы",
  anime: "Аниме",
};

const typeFilters: Array<{ key: ContentType | "all"; label: string }> = [
  { key: "all", label: "Всё" },
  { key: "movie", label: "Фильмы" },
  { key: "series", label: "Сериалы" },
  { key: "anime", label: "Аниме" },
];

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

  useEffect(() => {
    fetch("/data/catalog.json")
      .then((response) => {
        if (!response.ok) throw new Error("Catalog could not be loaded");
        return response.json();
      })
      .then((titles: Title[]) => setCatalog(titles))
      .catch(() => toast.error("Не удалось загрузить каталог. Обновите страницу."));

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

  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
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
      toast.error("Логин — от 3 символов, пароль — от 4 символов.");
      return;
    }

    const stored = localStorage.getItem(accountKey());
    const accounts: Record<string, StoredAccount> = stored ? JSON.parse(stored) : {};
    const passwordDigest = await digestPassword(authForm.password);

    if (authMode === "signup") {
      if (accounts[username]) {
        toast.error("Такой логин уже занят.");
        return;
      }
      accounts[username] = { passwordDigest, createdAt: new Date().toISOString() };
      localStorage.setItem(accountKey(), JSON.stringify(accounts));
      toast.success("Аккаунт создан. Добро пожаловать в MovieDar.");
    } else if (!accounts[username] || accounts[username].passwordDigest !== passwordDigest) {
      toast.error("Проверьте логин и пароль.");
      return;
    } else {
      toast.success("Вы снова в своей кинематеке.");
    }

    localStorage.setItem("moviedar:session", username);
    setUser(username);
    setAuthOpen(false);
  }

  function logout() {
    localStorage.removeItem("moviedar:session");
    setUser(null);
    toast.message("Вы вышли из аккаунта.");
  }

  function toggleFavorite(id: number) {
    const next = new Set(favorites);
    const isAdding = !next.has(id);
    if (isAdding) next.add(id);
    else next.delete(id);
    setFavorites(next);
    localStorage.setItem(favoriteKey(user), JSON.stringify(Array.from(next)));
    toast.success(isAdding ? "Добавлено в избранное" : "Убрано из избранного");
  }

  function openTrailer(title: Title) {
    if (!title.trailer_yt) {
      toast.message("Для этого тайтла пока нет трейлера.");
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
        aria-label={`Открыть: ${item.title}`}
      >
        <img
          src={item.poster}
          alt={`Постер: ${item.title}`}
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
          <span className="movie-card-meta">{item.year} · {typeLabels[item.type]}</span>
        </span>
      </button>
      <button
        type="button"
        className={`favorite-toggle ${favorites.has(item.id) ? "favorite-toggle-active" : ""}`}
        onClick={() => toggleFavorite(item.id)}
        aria-label={favorites.has(item.id) ? "Убрать из избранного" : "Добавить в избранное"}
      >
        <Heart size={16} fill={favorites.has(item.id) ? "currentColor" : "none"} />
      </button>
    </article>
  );

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="MovieDar — на главную">
          <img src="/manus-storage/moviedar-mark_25c38c9a.png" alt="" />
          <span className="brand-wordmark">Movie<span>Dar</span></span>
        </a>

        <nav className="desktop-nav" aria-label="Основная навигация">
          <button type="button" onClick={() => document.getElementById("home")?.scrollIntoView({ behavior: "smooth" })}>Главная</button>
          <button type="button" onClick={() => scrollToCatalog("movie")}>Фильмы</button>
          <button type="button" onClick={() => scrollToCatalog("series")}>Сериалы</button>
          <button type="button" onClick={() => scrollToCatalog("anime")}>Аниме</button>
        </nav>

        <div className="topbar-actions">
          <button type="button" className="icon-action" onClick={() => scrollToCatalog("all")} aria-label="Открыть поиск">
            <Search size={19} />
          </button>
          {user ? (
            <button type="button" className="user-chip" onClick={logout} title="Выйти из аккаунта">
              <span>{user.slice(0, 1).toUpperCase()}</span>
              <b>{user}</b>
            </button>
          ) : (
            <button type="button" className="signin-button" onClick={() => openAuth("login")}>Войти</button>
          )}
          <button type="button" className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Открыть меню">
            {mobileNav ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileNav && (
        <nav className="mobile-nav" aria-label="Мобильная навигация">
          <button type="button" onClick={() => document.getElementById("home")?.scrollIntoView({ behavior: "smooth" })}>Главная</button>
          <button type="button" onClick={() => scrollToCatalog("movie")}>Фильмы</button>
          <button type="button" onClick={() => scrollToCatalog("series")}>Сериалы</button>
          <button type="button" onClick={() => scrollToCatalog("anime")}>Аниме</button>
          {!user && <button type="button" onClick={() => openAuth("signup")}>Создать аккаунт</button>}
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
          <p className="eyebrow"><Sparkles size={15} /> Твоя кинематека на вечер</p>
          <h1>Истории, которые <em>остаются</em> после титров.</h1>
          <p className="hero-lede">Фильмы, сериалы и аниме — в одном месте. Ищи по настроению, сохраняй в очередь, возвращайся к лучшему.</p>
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
              placeholder="Название, жанр или год..."
              aria-label="Поиск по каталогу"
            />
            <button type="button" onClick={() => scrollToCatalog("all")}>Искать историю <ArrowRight size={17} /></button>
          </div>
          <div className="hero-statline">
            <span><strong>{catalog.length || "126"}</strong> тайтлов</span>
            <span><strong>3</strong> мира контента</span>
            <span><strong>0</strong> рекламы</span>
          </div>
        </div>
        <div className="hero-reel-note"><Clapperboard size={16} /> Выпуск #01 · август 2026</div>
      </section>

      <section className="content-section section-with-rails" aria-labelledby="picks-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Выбор сообщества · плёнка недели</p>
            <h2 id="picks-title">Сейчас в фокусе</h2>
          </div>
          <button className="text-link" type="button" onClick={() => scrollToCatalog("all")}>Весь каталог <ChevronRight size={17} /></button>
        </div>
        <div className="poster-rail">{highlights.map((item) => renderCard(item, true))}</div>
      </section>

      <section className="editorial-strip">
        <div className="editorial-copy">
          <p className="eyebrow">Кураторская подборка</p>
          <h2>Потеряй счёт времени.<br /><em>Найди свою историю.</em></h2>
          <p>От тихих аниме-путешествий до сериалов, которые невозможно поставить на паузу.</p>
          <button type="button" className="outline-button" onClick={() => scrollToCatalog("anime")}>Смотреть аниме <ArrowRight size={17} /></button>
        </div>
        <div className="editorial-collage" aria-hidden="true">
          {freshPicks.slice(0, 4).map((item, index) => <img key={item.id} className={`collage-${index + 1}`} src={item.poster} alt="" referrerPolicy="no-referrer" />)}
        </div>
      </section>

      <section className="content-section catalog-section" id="catalog" aria-labelledby="catalog-title">
        <div className="section-heading catalog-heading">
          <div>
            <p className="eyebrow">{filteredCatalog.length} из {catalog.length} тайтлов · архив после титров</p>
            <h2 id="catalog-title">Истории для будущих вечеров</h2>
          </div>
          {favoriteTitles.length > 0 && <button type="button" className="favorites-status" onClick={() => setActiveType("all")}><Heart size={15} fill="currentColor" /> В избранном {favoriteTitles.length}</button>}
        </div>

        <div className="catalog-layout">
          <aside className="filter-panel">
            <div className="filter-title"><SlidersHorizontal size={16} /> Плёнка архива</div>
            <p>Выбрать формат</p>
            <div className="filter-options">
              {typeFilters.map((filter) => (
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
            <div className="filter-note">Отмечай истории на потом: избранное живёт в этом браузере и возвращается вместе с твоим логином.</div>
          </aside>

          <div className="catalog-main">
            <div className="catalog-toolbar">
              <label>
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти историю в архиве" />
              </label>
              <span>{activeType === "all" ? "Все форматы" : typeLabels[activeType]}</span>
            </div>
            {catalog.length === 0 ? (
              <div className="catalog-loading">Загружаем тайтлы…</div>
            ) : filteredCatalog.length ? (
              <>
                <div className="catalog-grid">{filteredCatalog.slice(0, visibleCount).map((item) => renderCard(item))}</div>
                {visibleCount < filteredCatalog.length && (
                  <button className="load-more" type="button" onClick={() => setVisibleCount((count) => count + 24)}>Показать ещё <span>({filteredCatalog.length - visibleCount})</span></button>
                )}
              </>
            ) : (
              <div className="empty-state"><Search size={28} /><h3>Эта сцена ещё не найдена</h3><p>Смените название, год или настроение — архив помнит больше.</p><button type="button" onClick={() => setQuery("")}>Вернуть весь архив</button></div>
            )}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/manus-storage/moviedar-mark_25c38c9a.png" alt="" />
          <div><strong>MovieDar</strong><span>Твоя личная кинематека</span></div>
        </div>
        <p>Кинематека для знакомства с фильмами, сериалами и аниме. Полные версии здесь не размещаются — остаются только истории, к которым хочется вернуться.</p>
        <button type="button" onClick={() => scrollToCatalog("all")}>К каталогу <ArrowRight size={16} /></button>
      </footer>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="auth-dialog">
          <div className="auth-art" />
          <div className="auth-body">
            <DialogHeader>
              <p className="eyebrow">Личная кинематека</p>
              <DialogTitle>{authMode === "login" ? "С возвращением." : "Сохрани свои истории."}</DialogTitle>
              <DialogDescription>{authMode === "login" ? "Войди, чтобы продолжить собирать избранное под своим именем." : "Аккаунт хранится только в этом браузере — без Firebase и сторонних сервисов."}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAuth} className="auth-form">
              <label>Логин<input value={authForm.username} autoComplete="username" onChange={(event) => setAuthForm((value) => ({ ...value, username: event.target.value }))} placeholder="например, movielover" /></label>
              <label>Пароль<input type="password" value={authForm.password} autoComplete={authMode === "login" ? "current-password" : "new-password"} onChange={(event) => setAuthForm((value) => ({ ...value, password: event.target.value }))} placeholder="минимум 4 символа" /></label>
              <button className="auth-submit" type="submit">{authMode === "login" ? "Войти в MovieDar" : "Создать аккаунт"} <ArrowRight size={17} /></button>
            </form>
            <button type="button" className="auth-switch" onClick={() => setAuthMode((mode) => (mode === "login" ? "signup" : "login"))}>{authMode === "login" ? "Нет аккаунта? Создать" : "Уже есть аккаунт? Войти"}</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="detail-dialog">
            <div className="detail-backdrop" />
            <div className="detail-content">
              <img className="detail-poster" src={selected.poster} alt={`Постер: ${selected.title}`} referrerPolicy="no-referrer" />
              <div className="detail-copy">
                <div className="detail-topline"><span>{typeLabels[selected.type]}</span><span>{selected.year}</span><span className={`rating-ring ${ratingTone(selected.rating)}`}>{selected.rating.toFixed(1)}</span></div>
                <DialogTitle>{selected.title}</DialogTitle>
                {selected.tagline && <p className="tagline">{selected.tagline}</p>}
                <div className="genre-line">{selected.genres.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}</div>
                <DialogDescription>{selected.overview}</DialogDescription>
                <p className="detail-facts">{selected.runtime ? `${selected.runtime} мин.` : selected.episodes ? `${selected.episodes} эп.` : "Формат уточняется"}{selected.crew?.[0] ? ` · ${selected.crew_label || "Автор"}: ${selected.crew[0]}` : ""}</p>
                <div className="detail-actions">
                  <button type="button" className="watch-trailer" onClick={() => openTrailer(selected)}><Play size={17} fill="currentColor" /> Официальный трейлер</button>
                  <button type="button" className="detail-favorite" onClick={() => toggleFavorite(selected.id)}><Heart size={17} fill={favorites.has(selected.id) ? "currentColor" : "none"} /> {favorites.has(selected.id) ? "В избранном" : "В избранное"}</button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}
