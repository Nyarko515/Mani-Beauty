import styles from '../styles/about.module.css'

export const metadata = {
  title: 'About Mani Beauty | Hair & Beauty Salon in Accra',
  description: 'Learn about Mani Beauty, a hair extensions, braids and wig salon serving Haatso, Atomic, Legon and Madina.',
}

export default function AboutPage() {
  const timeline = [
    {
      period: '2015 - 2016',
      title: 'The Beginning',
      detail: 'Started on campus through braiding for friends and family, and selling affordable beauty products.',
    },
    {
      period: '2017',
      title: 'Natural Skincare Sourcing',
      detail: 'Began sourcing organic skin and hair oils for family and friends on request.',
    },
    {
      period: '2021',
      title: 'Taking the Business Seriously',
      detail: 'Moved online to test products and understand customer needs as demand grew.',
    },
    {
      period: '2022',
      title: 'First Small Outlet',
      detail: 'Opened a small walk-in space as a test outlet, and trained support staff to help run the operation.',
    },
    {
      period: '2023',
      title: 'Official Shop Opening',
      detail: 'Launched the first shop and built a small team to officially operate as a business.',
    },
    {
      period: 'Today',
      title: 'Growing with Purpose',
      detail: 'Combining products and services while improving systems for growth.',
    },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroCollage} aria-hidden="true">
          <img src="/images/photos/photo1.jpg" alt="" className={styles.collageTall} />
          <img src="/images/photos/photo2.jpg" alt="" className={styles.collageTall} />
          <img src="/images/photos/photo3.jpg" alt="" className={styles.collageTall} />
          <img src="/images/photos/photo4.jpg" alt="" className={styles.collageWide} />
          <img src="/images/photos/photo5.jpg" alt="" className={styles.collageTall} />
        </div>
        <div className={styles.heroShade} />

        <div className={`container ${styles.heroContent}`}>
          <h1 className={styles.heroTitle} aria-label="The Beauty of Confidence">
            <span className={styles.heroTitleSmall}>The</span>
            <span className={styles.heroTitleLarge}>Beauty</span>
            <span className={styles.heroTitleSmall}>of</span>
            <span className={styles.heroTitleLarge}>Confidence</span>
          </h1>
        </div>
      </section>

      <section className={styles.aboutIntroSection}>
        <div className="container">
          <div className={styles.aboutIntro}>
            <span className={styles.eyebrow}>About Mani Beauty</span>
            <p className={styles.heroText}>
              Mani Beauty is a destination for hair extensions, trusted beauty products and professional salon services, created to help every client feel confident, cared for and beautifully seen.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className={styles.storySection}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyImageWrap}>
              <img src="/images/photos/IMG_0180.PNG" alt="Mani Beauty founders smiling together" className={styles.storyImage} />
            </div>
            <div className={styles.storyCopy}>
              <span className={styles.eyebrow}>Our Story</span>
              <h2 className={styles.storyTitle}>
                Beauty as confidence, care and community.
              </h2>
              <p className={styles.storyText}>
                Mani Beauty began in a very simple way; with a desire to make beauty more accessible.
              </p>
              <p className={styles.storyText}>
                Over time, it has grown into a business that is not only about products and services, but also about people, opportunities, and community.
              </p>
              <p className={`${styles.storyText} ${styles.storyTextLast}`}>
                Our focus remains on building something meaningful; providing quality, supporting our team, and creating a space where everyone feels welcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.journeySection}>
        <div className="container">
          <div className={styles.journeyHeading}>
            <h2 className={styles.journeyTitle}>Timeline</h2>
            <p className={styles.journeyIntro}>Key milestones in the Mani Beauty story.</p>
          </div>
          <div className={styles.timelineList}>
            {timeline.map((item, index) => (
              <article key={item.period} className={`${styles.timelineItem} ${index % 2 ? styles.timelineItemRight : styles.timelineItemLeft}`}>
                <div className={styles.timelineDot} aria-hidden="true" />
                <span className={styles.timelinePeriod}>{item.period}</span>
                <div className={styles.timelineContent}>
                  <h3 className={styles.timelineMilestone}>{item.title}</h3>
                  <p className={styles.timelineDetail}>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-choose-us" className={styles.whySection}>
        <div className="container">
          <div className={styles.whyHeading}>
            <span className={styles.eyebrow}>Why Us</span>
            <h2>Why Choose Mani Beauty</h2>
          </div>
          <div className={styles.whyLayout}>
            <div className={styles.whyMedia}>
              <img src="/images/about/updates/IMG_9405.JPG" alt="Long twisted protective hairstyle with detailed cornrows" />
              <img src="/images/about/updates/IMG_9406.JPG" alt="Long twisted protective hairstyle with side cornrow design" />
            </div>
            <div className={styles.whyGrid}>
              <article><h3>Quality Products</h3><p>We carefully select hair extensions and beauty products that deliver great value and lasting results.</p></article>
              <article><h3>Exceptional Customer Care</h3><p>We listen, advise, and serve with care, ensuring every customer feels valued and leaves with confidence.</p></article>
              <article><h3>Affordable Prices</h3><p>Enjoy quality beauty products and salon services at prices designed for everyday beauty.</p></article>
              <article><h3>Everything in One Place</h3><p>Shop for your favourite beauty essentials and enjoy professional salon services—all under one roof.</p></article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.instagramSection}>
        <div className="container">
          <div className={styles.instagramHeading}>
            <span className={styles.eyebrow}>@manibeautylounge</span>
            <h2>Follow Our Latest Looks</h2>
          </div>
          <div className={styles.instagramLiveCard}>
            <span className={styles.instagramHandle}>@manibeautylounge</span>
            <p>See our newest braids, installations, beauty arrivals and salon moments directly on Instagram.</p>
            <a href="https://www.instagram.com/manibeautylounge/" target="_blank" rel="noopener noreferrer" className={`btn ${styles.instagramButton}`}>
              View Latest Instagram Posts
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
