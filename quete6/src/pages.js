const siteUrl = new URL(import.meta.env.VITE_SITE_ORIGIN || 'http://localhost:5176');
if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
  throw new Error('VITE_SITE_ORIGIN doit être une origine HTTP(S), sans chemin ni paramètre.');
}
export const origin = siteUrl.origin;

export const dishes = [
  {
    slug: 'pizza-margherita',
    name: 'Pizza Margherita',
    description: 'Découvrez la pizza Margherita de La Table : une pâte dorée, une sauce tomate, de la mozzarella et du basilic. Consultez les ingrédients et le reste de notre menu.',
    summary: 'Une pizza à la tomate, à la mozzarella et au basilic.',
    ingredients: ['Pâte à pizza', 'Sauce tomate', 'Mozzarella', 'Basilic'],
    allergens: 'Gluten et lait',
  },
  {
    slug: 'risotto-champignons',
    name: 'Risotto aux champignons',
    description: 'Découvrez le risotto aux champignons de La Table : du riz crémeux, des champignons et du parmesan. Retrouvez les ingrédients et les autres plats de notre menu.',
    summary: 'Un risotto crémeux aux champignons et au parmesan.',
    ingredients: ['Riz à risotto', 'Champignons', 'Bouillon de légumes', 'Parmesan'],
    allergens: 'Lait',
  },
];

export const routes = ['/', ...dishes.map(dish => '/menu/' + dish.slug)];

export function getPage(pathname) {
  if (pathname === '/') {
    return {
      title: 'Restaurant La Table : notre carte et nos plats',
      description: 'Découvrez la carte du restaurant La Table : pizza Margherita et risotto aux champignons. Consultez chaque plat, ses ingrédients et ses informations pratiques.',
      canonical: origin + '/',
      robots: 'index,follow',
    };
  }
  const dish = dishes.find(item => '/menu/' + item.slug === pathname);
  if (dish) {
    return {
      title: dish.name + ' | Restaurant La Table',
      description: dish.description,
      canonical: origin + pathname,
      robots: 'index,follow',
      dish,
    };
  }
  return {
    title: 'Page introuvable | Restaurant La Table',
    description: 'Cette page est introuvable. Retrouvez la carte du restaurant La Table.',
    canonical: null,
    robots: 'noindex,follow',
  };
}
