import LocalSEOPage from '../LocalSEOPage'

const faqItems = [
  {
    question: 'Is there a good salon near Legon?',
    answer: 'Yes. Mani Beauty is a popular salon choice for clients around Legon looking for braids, wigs, hair extensions and beauty services.',
  },
  {
    question: 'Do you do braids and extensions for clients around Legon?',
    answer: 'Yes. We offer protective braids, braid styling, extensions and wig services for women seeking a polished look close to Legon.',
  },
  {
    question: 'Can I book for a hair appointment in Legon?',
    answer: 'Yes. Contact the salon or use the booking page to arrange your preferred appointment.',
  },
]

export const metadata = {
  title: 'Salons at Legon | Mani Beauty',
  description: 'Find Mani Beauty for braids, wigs, hair extensions and beauty salon services near Legon, Ghana.',
}

export default function LegonPage() {
  return (
    <LocalSEOPage
      title="Salons at Legon"
      subtitle="Mani Beauty helps clients around Legon find beautiful, comfortable and professional salon experiences."
      description="Searching for salons at Legon? Mani Beauty offers braids, hair extensions, wigs, and premium beauty care for clients in and around Legon, Ghana."
      locationName="Legon"
      branchText="Whether you need a fresh style, protective hairstyle, or high-quality hair extension service, Mani Beauty is a trusted salon choice near Legon."
      faqItems={faqItems}
    />
  )
}
