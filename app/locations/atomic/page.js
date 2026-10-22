import LocalSEOPage from '../LocalSEOPage'

const faqItems = [
  {
    question: 'Where is Mani Beauty near Atomic Junction?',
    answer: 'The Mani Beauty Atomic branch is at Atomic Junction Roundabout in Accra, serving clients from Atomic and nearby communities.',
  },
  {
    question: 'Do you offer hair extensions and braids around Atomic?',
    answer: 'Yes. Our salon near Atomic Junction Roundabout offers premium hair extensions, braids, protective styles and beauty consultations.',
  },
  {
    question: 'Can I book a beauty appointment in Atomic?',
    answer: 'Yes. Visit the contact page or book online for your preferred styling service and appointment time.',
  },
]

export const metadata = {
  title: 'Mani Beauty at Atomic Junction Roundabout | Accra Salon',
  description: 'Visit Mani Beauty at Atomic Junction Roundabout in Accra for braids, wigs, hair extensions and beauty salon services. Book online or contact our team.',
}

export default function AtomicPage() {
  return (
    <LocalSEOPage
      title="Mani Beauty at Atomic Junction Roundabout"
      subtitle="Find braids, wigs, hair extensions and professional beauty services at the Mani Beauty salon by Atomic Junction Roundabout in Accra."
      description="Visit our Atomic branch for protective styles, wig services, hair extensions and beauty products, with online booking available for your preferred appointment."
      locationName="Atomic Junction Roundabout"
      branchText="Our Atomic Junction Roundabout branch welcomes clients from Atomic, Madina, Legon and nearby Accra communities for professional styling and beauty care."
      faqItems={faqItems}
    />
  )
}
