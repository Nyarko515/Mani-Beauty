import { ExternalLink, MessageCircle, Star } from 'lucide-react'
import styles from './page.module.css'

const googleReviewsUrl = 'https://www.google.com/search?kgmid=/g/11rhy6228n&hl=fr-GH&q=Mani+Beauty&shem=epsd1,ltae,rimspwouoe&shndl=30&source=sh/x/loc/osrp/m1/3&kgs=12a72cee665ef41c&utm_source=epsd1,ltae,rimspwouoe,sh/x/loc/osrp/m1/3#'

const reviews = [
  { name: 'Glenn Matanawui', text: 'Excellent customer service. Takes all customer feedback into account.' },
  { name: 'Deedee Prempeh', text: 'They have been my supplier for two years and I have always been satisfied with the quality of their products. I feel completely reassured about the quality of their products with every purchase.' },
  { name: 'ethel laura', text: "I love their detailed product descriptions. If you're unsure which beauty products to use, they're the best source of inspiration. Their recommendations are always reliable and work 100% of the time." },
  { name: 'inspiration abdul', text: "They are always punctual for deliveries. I've never had a problem with my orders or with shipping 😘" },
  { name: 'Jennifer Aidoo', text: 'I appreciate your excellent customer service and the fact that the products arrive in perfect condition. I will definitely be back! 🥰 🥰' },
  { name: 'Meenakshi Bhojwani', text: 'I ordered products via WhatsApp; the service was fast and extremely efficient! I will definitely order again 😁' },
  { name: 'Fawzia Mahmoud', text: 'Excellent customer service. The staff are very friendly and patient. I recommend their services.' },
  { name: 'Walid George Khairallah', text: 'They offer a wider range of original cosmetic products than any other store in Ghana and, honestly, the best prices.' },
  { name: 'Razak Sabi', text: 'Mani Beauty is the best and most trusted online store where your money is safe. Keep up the excellent service, thank you!' },
  { name: "Melliey's World", text: 'Mani Beauty is the ideal place to find all your body, face and hair products, with complete satisfaction and no risk of being scammed 😍 😍 😍 The customer service is always impeccable 🔥 🔥 💗 Keep up the good work!' },
  { name: 'Jessica Flourish', text: 'The delivery service is good and the customer service is pleasant. Thank you.' },
  { name: 'Body Goddes', text: "She's so nice, but she didn't give me free delivery. 😭😭😭" },
  { name: 'Jikiba Francisca', text: 'Quality products at affordable prices and excellent customer service 😍' },
  { name: 'Ruth Fordjour', text: 'Your products are very affordable.\nI love your service.' },
  { name: 'Christabel Sally Crabbe', text: 'Quality products at very affordable prices.' },
  { name: 'Keziah Sarpong', text: 'They have very good products' },
  { name: 'Comfort Ahontor', text: 'I greatly appreciate the speed of your services. Thank you.' },
  { name: 'Doreen Derzu', text: 'Authentic products. Excellent customer service.' },
  { name: 'FredExcel', text: 'Affordable prices.' },
  { name: 'JD-Link Head Office8', text: 'Super' },
]

const instagramChats = [
  {
    image: '/images/reviews/instagram/client-products-feedback.jpeg',
    alt: 'Instagram conversation from a client enjoying the scent of their body butter',
    quote: 'The body butter smells very nice.',
    detail: 'Product love',
  },
  {
    image: '/images/reviews/instagram/client-affordable-products.jpeg',
    alt: 'Instagram conversation praising Mani Beauty products and affordable prices',
    quote: 'Your products are good — and very affordable.',
    detail: 'Quality & value',
  },
  {
    image: '/images/reviews/instagram/client-customer-care.jpeg',
    alt: 'Instagram conversation thanking Mani Beauty for caring about customers',
    quote: 'You have proved to be customer lovers.',
    detail: 'Customer care',
  },
  {
    image: '/images/reviews/instagram/client-return-purchase.jpeg',
    alt: 'Instagram conversation from a returning customer thanking Mani Beauty',
    quote: 'I went for it. Thanks so much.',
    detail: 'Repeat customer',
  },
]

export default function ReviewsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Client Experiences</span>
          <h1>What Our Clients Say</h1>
          <p>Real words from customers who have shopped with and experienced Mani Beauty.</p>
          <div className={styles.ratingSummary}>
            <strong>4.8</strong>
            <span className={styles.ratingStars} aria-label="4.8 out of 5 stars">
              {[...Array(5)].map((_, index) => <Star key={index} size={19} fill="currentColor" />)}
            </span>
            <span>56 Google reviews</span>
          </div>
        </div>
        <div className={styles.heroImages} aria-hidden="true">
          <img src="/images/reviews-hero/IMG_9434.JPG" alt="" />
          <img src="/images/reviews-hero/IMG_9435.JPG" alt="" />
          <img src="/images/reviews-hero/IMG_9437.JPG" alt="" />
        </div>
      </section>

      <section className={styles.chatSection}>
        <div className={`container-wide ${styles.chatContainer}`}>
          <div className={styles.chatHeading}>
            <div>
              <span className={styles.eyebrow}>Straight From The DMs</span>
              <h2>Real chats. Real beauty love.</h2>
            </div>
            <p>
              A few kind messages shared by customers after shopping with Mani Beauty —
              from product quality and value to the care behind every order.
            </p>
          </div>

          <div className={styles.chatGrid} aria-label="Customer Instagram conversations">
            {instagramChats.map((chat, index) => (
              <article key={chat.image} className={styles.chatCard}>
                <div className={styles.phoneFrame}>
                  <div className={styles.phoneTop} aria-hidden="true">
                    <span />
                    <div className={styles.phoneSpeaker} />
                    <MessageCircle size={15} />
                  </div>
                  <div className={styles.chatImageWrap}>
                    <img src={chat.image} alt={chat.alt} loading={index === 0 ? 'eager' : 'lazy'} />
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className={styles.swipeHint}>Swipe to see more customer chats</p>
        </div>
      </section>

      <section className={styles.reviewsSection}>
        <div className="container">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Five-Star Feedback</span>
              <h2>Reviews From Our Community</h2>
            </div>
            <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className={styles.googleLink}>
              View all Google reviews <ExternalLink size={16} />
            </a>
          </div>

          <div className={styles.reviewsGrid}>
            {reviews.map((review) => (
              <article key={review.name} className={styles.reviewCard}>
                <div className={styles.cardTop}>
                  <span className={styles.avatar} aria-hidden="true">{review.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <h3>{review.name}</h3>
                    <span className={styles.cardStars} aria-label="Five stars">
                      {[...Array(5)].map((_, index) => <Star key={index} size={14} fill="currentColor" />)}
                    </span>
                  </div>
                  <span className={styles.googleBadge}>G</span>
                </div>
                <p>{review.text}</p>
                <span className={styles.source}>Google review</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
