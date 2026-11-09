import {useEffect} from 'react';
import {Link, Route, Routes, useLocation, useParams} from 'react-router';
import {dishes, getPage} from './pages.js';

function Metadata() {
  const {pathname} = useLocation();
  useEffect(() => {
    const page = getPage(pathname);
    document.title = page.title;
    for (const [name, content] of [['description', page.description], ['robots', page.robots]]) {
      let meta = document.querySelector('meta[name="' + name + '"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.append(meta);
      }
      meta.content = content;
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (page.canonical) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = page.canonical;
    } else {
      canonical?.remove();
    }
  }, [pathname]);
  return null;
}

function Menu() {
  return (
    <main>
      <h1>Restaurant La Table</h1>
      <p>Une cuisine simple à découvrir à travers les plats de notre carte.</p>
      <h2>Notre menu</h2>
      <ul className="menu">
        {dishes.map(dish => (
          <li key={dish.slug}>
            <h3>{dish.name}</h3>
            <p>{dish.summary}</p>
            <Link to={'/menu/' + dish.slug}>Découvrir : {dish.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function NotFound() {
  return <main><h1>Page introuvable</h1><p>Ce plat ou cette page n'existe pas.</p><Link to="/">Retrouver la carte du restaurant</Link></main>;
}

function Dish() {
  const {slug} = useParams();
  const dish = dishes.find(item => item.slug === slug);
  if (!dish) return <NotFound />;
  return (
    <main>
      <h1>{dish.name}</h1>
      <p>{dish.summary}</p>
      <h2>Ingrédients</h2>
      <ul>{dish.ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul>
      <h2>Allergènes</h2>
      <p>{dish.allergens}</p>
      <Link to="/">Consulter les autres plats de la carte</Link>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Metadata />
      <header><nav aria-label="Navigation principale"><Link to="/">La Table — la carte</Link></nav></header>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/menu/:slug" element={<Dish />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer>La Table</footer>
    </>
  );
}
