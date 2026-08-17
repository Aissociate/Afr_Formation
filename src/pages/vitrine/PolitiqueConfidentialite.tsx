import { useSeo } from '../../lib/seo'

export default function PolitiqueConfidentialite() {
  useSeo({
    title: 'Politique de confidentialité',
    description: 'Politique de confidentialité du site afr-formation.fr — comment AFR collecte, utilise et protège vos données personnelles (RGPD).',
    path: '/politique-confidentialite',
  })

  return (
    <div className="bg-white">
      <section className="bg-dark-800 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Politique de confidentialité</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 prose prose-neutral prose-headings:font-bold prose-headings:text-neutral-900">
          <h2>Responsable du traitement</h2>
          <p>
            AFR — Accompagnement Formation Réussite, 30 rue des topazes, Rivière des Roches,
            97412 Bras-Panon — La Réunion. Contact : contact@afr-formation.fr.
          </p>

          <h2>Données collectées</h2>
          <p>
            Lorsque vous remplissez un formulaire sur ce site (contact, questionnaire, demande de
            devis), nous collectons les informations que vous nous transmettez : nom, prénom,
            adresse email, numéro de téléphone, localité, situation professionnelle et les réponses
            au questionnaire d'orientation.
          </p>

          <h2>Finalités</h2>
          <p>Ces données sont utilisées exclusivement pour :</p>
          <ul>
            <li>répondre à vos demandes de contact ou de devis ;</li>
            <li>établir votre Plan de Formation Individualisé (PFI) ;</li>
            <li>vous accompagner dans votre projet de formation et son financement.</li>
          </ul>
          <p>Elles ne sont ni vendues ni transmises à des tiers à des fins commerciales.</p>

          <h2>Base légale et durée de conservation</h2>
          <p>
            Le traitement repose sur votre consentement et sur les mesures précontractuelles
            liées à votre demande. Les données sont conservées pendant la durée nécessaire au
            traitement de votre demande, puis au maximum 3 ans après le dernier contact.
          </p>

          <h2>Hébergement des données</h2>
          <p>
            Les données des formulaires sont stockées de manière sécurisée via Supabase,
            et le site est hébergé par Netlify. Des mesures techniques et organisationnelles
            appropriées protègent vos données contre tout accès non autorisé.
          </p>

          <h2>Cookies</h2>
          <p>
            Ce site n'utilise pas de cookies publicitaires ni de traceurs tiers à des fins de
            suivi. Seuls des stockages techniques strictement nécessaires au fonctionnement du
            site peuvent être utilisés.
          </p>

          <h2>Vos droits</h2>
          <p>
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit
            d'accès, de rectification, d'effacement, de limitation et d'opposition sur vos
            données. Pour l'exercer, écrivez-nous à{' '}
            <a href="mailto:contact@afr-formation.fr">contact@afr-formation.fr</a>. Vous pouvez
            également introduire une réclamation auprès de la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
          </p>
        </div>
      </section>
    </div>
  )
}
