import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <>
      <div className={styles.link_container}>
        <Link href="/sample">Sample</Link>
        <Link href="/scroll">Scroll</Link>
        <Link href="/point_cloud_loader">PointCloudLoader</Link>
        <Link href="/golf_course_tour">GolfCourseTour</Link>
        <Link href="/moving_object_with_scroll">MovingObjectWithScroll</Link>
      </div>
    </>
  )
}
