import LocalSEOPage from '../LocalSEOPage'

const faqItems = [
  {
    question: 'Is Mani Beauty a good salon in Haatso?',
    answer: 'Yes. Mani Beauty serves clients in Haatso with braids, hair extensions, wigs and beauty services tailored to individual styling needs.',
  },
  {
    question: 'Do you offer braids and hair extensions near Haatso?',
    answer: 'Yes. Our salon offers braided styles, protective hairstyles and premium hair extensions for women looking for a quality finish close to home.',
  },
  {
    question: 'Can I book a salon appointment in Haatso?',
    answer: 'Yes. You can contact Mani Beauty or book online for appointments and styling consultations.',
  },
]

export const metadata = {
  title: 'Salons at Haatso | Mani Beauty',
  description: 'Find Mani Beauty for braids, hair extensions, wigs and salon services in Haatso, Ghana.',
}

export default function HaatsoPage() {
  return (
    <LocalSEOPage
      title="Salons at Haatso"
      subtitle="Mani Beauty offers braids, wigs, hair extensions and beauty services for clients in Haatso and nearby communities."
      description="Looking for a salon in Haatso, Ghana? Mani Beauty is a trusted beauty destination for professional styling, hair extensions and beauty products close to your area."
      locationName="Haatso"
      branchText="Our salon helps clients from Haatso find reliable hair and beauty care, whether they need a fresh braid look, wig installation or hair extension styling."
      faqItems={faqItems}
    />
  )
}
