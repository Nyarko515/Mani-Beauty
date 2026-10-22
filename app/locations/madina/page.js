import LocalSEOPage from '../LocalSEOPage'

const faqItems = [
  {
    question: 'Is Mani Beauty a salon near Madina?',
    answer: 'Yes. Mani Beauty offers professional beauty and hair services for clients around Madina who want braids, wigs, hair extensions and quality styling.',
  },
  {
    question: 'Do you offer hair extension services in Madina?',
    answer: 'Yes. Our salon provides premium hair extension styles and full beauty care for clients in and around Madina.',
  },
  {
    question: 'How can I book near Madina?',
    answer: 'You can contact the salon directly or use the booking page to reserve your appointment.',
  },
]

export const metadata = {
  title: 'Salons at Madina | Mani Beauty',
  description: 'Find Mani Beauty for braids, hair extensions and beauty salon services near Madina, Ghana.',
}

export default function MadinaPage() {
  return (
    <LocalSEOPage
      title="Salons at Madina"
      subtitle="Mani Beauty offers quality salon services for clients in Madina who want stylish braids, wigs and hair extensions."
      description="Looking for salons at Madina? Mani Beauty is a trusted beauty salon for hair extensions, braids, wigs and beauty care for clients in and around Madina."
      locationName="Madina"
      branchText="Clients around Madina choose Mani Beauty for stylish protective hair looks, professional extension care and personalised beauty support."
      faqItems={faqItems}
    />
  )
}
