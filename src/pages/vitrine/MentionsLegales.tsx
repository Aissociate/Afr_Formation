import { useSeo } from '../../lib/seo'

export default function MentionsLegales() {
  useSeo({
    title: 'Mentions légales',
    description: 'Mentions légales du site afr-formation.fr — AFR (Accompagnement Formation Réussite), organisme de formation à La Réunion.',
    path: '/mentions-legales',
  })

  return (
    <div className="bg-white">
      <section className="bg-dark-800 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Mentions légales</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 prose prose-neutral prose-headings:font-bold prose-headings:text-neutral-900">
          <h2>Éditeur du site</h2>
          <p>
            <strong>AFR — Accompagnement Formation Réussite</strong><br />
            30 rue des topazes, Rivière des Roches<br />
            97412 Bras-Panon — La Réunion<br />
            SIRET : 995 220 407 00010<br />
            Numéro de déclaration d'activité (NDA) : 04 97 37547 97<br />
            Téléphone : +262 692 57 45 91<br />
            Email : contact@afr-formation.fr
          </p>
          <p>
            Organisme de formation professionnelle certifié Qualiopi, enregistré auprès de la
            DEETS de La Réunion. Cet enregistrement ne vaut pas agrément de l'État.
          </p>

          <h2>Directeur de la publication</h2>
          <p>Le représentant légal d'AFR — Accompagnement Formation Réussite.</p>

          <h2>Hébergement</h2>
          <p>
            Ce site est hébergé par <strong>Netlify, Inc.</strong><br />
            512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis —{' '}
            <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">www.netlify.com</a>
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus de ce site (textes, images, logos, structure) est la propriété
            d'AFR ou de ses partenaires et est protégé par le droit de la propriété intellectuelle.
            Toute reproduction non autorisée est interdite.
          </p>

          <h2>Données personnelles</h2>
          <p>
            Les données collectées via les formulaires du site sont traitées conformément à notre{' '}
            <a href="/politique-confidentialite">politique de confidentialité</a>.
          </p>
        </div>
      </section>
    </div>
  )
}
