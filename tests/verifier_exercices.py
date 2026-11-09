"""Vérifie les pages et les vraies réponses HTTP d'un serveur Apache."""
import argparse
import http.client
import ssl
from html.parser import HTMLParser
from urllib.parse import urlsplit


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.head = False
        self.title = False
        self.title_text = ""
        self.descriptions = []
        self.canonicals = []
        self.headings = []
        self.links = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "head":
            self.head = True
        if tag == "title" and self.head:
            self.title = True
        if tag == "meta" and self.head and attrs.get("name") == "description":
            self.descriptions.append(attrs.get("content", ""))
        if tag == "link" and self.head and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href"))
        if tag in ("h1", "h2", "h3"):
            self.headings.append(tag)
        if tag == "a":
            self.links.append(attrs.get("href"))

    def handle_endtag(self, tag):
        if tag == "head":
            self.head = False
        if tag == "title":
            self.title = False

    def handle_data(self, text):
        if self.title:
            self.title_text += text


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--quete3", default="http://127.0.0.1:5186")
    parser.add_argument("--quete4-http", default="http://127.0.0.1:5187")
    parser.add_argument("--quete4-https", default="https://127.0.0.1:5443")
    parser.add_argument("--ca", help="Certificat de l'autorité locale pour le test HTTPS")
    args = parser.parse_args()
    context = ssl.create_default_context(cafile=args.ca)
    count = 0

    def request(origin, path, host="monsite.fr"):
        address = urlsplit(origin)
        connection = (
            http.client.HTTPSConnection(address.hostname, address.port, context=context, timeout=10)
            if address.scheme == "https"
            else http.client.HTTPConnection(address.hostname, address.port, timeout=10)
        )
        try:
            connection.request("GET", path, headers={"Host": host})
            response = connection.getresponse()
            return response.status, response.getheader("Location"), response.read().decode("utf-8")
        finally:
            connection.close()

    def check(condition, message):
        nonlocal count
        assert condition, message
        count += 1
        print("OK :", message)

    titles = set()
    descriptions = set()
    for route in ["/", "/produits/velo-electrique-pliable", "/produits/velo-electrique-ville"]:
        status, _, body = request(args.quete3, route)
        check(status == 200, "Quête 3 : page accessible " + route)
        page = Page(body)
        check("électrique" in page.title_text.lower(), "Titre descriptif " + route)
        check(len(page.descriptions) == 1 and bool(page.descriptions[0]), "Description présente " + route)
        check(page.title_text not in titles, "Titre unique " + route)
        check(page.descriptions[0] not in descriptions, "Description unique " + route)
        titles.add(page.title_text)
        descriptions.add(page.descriptions[0])
        check(page.headings[0] == "h1" and page.headings.count("h1") == 1 and "h2" in page.headings, "Hiérarchie des titres " + route)
        check("cliquez ici" not in body.lower(), "Ancre explicite " + route)
        if route == "/":
            check("/produits/velo-electrique-pliable" in page.links, "Lien vers la fiche produit")
            check("/produits/velo-electrique-ville" in page.links, "Lien vers la seconde fiche produit")

    for old in ["/produit?id=42", "/produite?id=42", "/produit.html", "/produits/velo-electrique-pliable/"]:
        status, location, _ = request(args.quete3, old)
        check(status == 301 and urlsplit(location).path == "/produits/velo-electrique-pliable" and not urlsplit(location).query, "Ancienne URL redirigée : " + old)

    for old in ["/produit?id=43", "/produite?id=43", "/produit-ville.html", "/produits/velo-electrique-ville/"]:
        status, location, _ = request(args.quete3, old)
        check(status == 301 and urlsplit(location).path == "/produits/velo-electrique-ville" and not urlsplit(location).query, "Seconde ancienne URL redirigée : " + old)

    canonical = "https://monsite.fr/produit/42"
    for origin in [args.quete4_http, args.quete4_https]:
        for route in ["/produit/42", "/produit/42/", "/produit.html"]:
            for query in ["", "?utm_source=facebook"]:
                status, location, body = request(origin, route + query)
                if origin == args.quete4_https and route == "/produit/42":
                    check(status == 200 and location is None, "HTTPS sans redirection : " + route + query)
                    check(Page(body).canonicals == [canonical], "Une seule canonical sans paramètre : " + route + query)
                else:
                    check(status == 301 and location == canonical + query, "301 en un saut, suivi conservé : " + origin + route + query)

    status, location, _ = request(args.quete4_https, "/produit/42", "autre.example")
    check(status == 301 and location == canonical, "Domaine alternatif redirigé vers le domaine de référence")
    for origin in [args.quete3, args.quete4_https]:
        status, _, _ = request(origin, "/page-inexistante")
        check(status == 404, "Vrai statut 404 pour une page absente")
    normal = request(args.quete4_https, "/produit/42")[2]
    tracked = request(args.quete4_https, "/produit/42?utm_source=facebook")[2]
    check(normal == tracked, "Même HTML avec et sans paramètre Facebook")
    print(f"{count} vérifications réussies.")


if __name__ == "__main__":
    main()
