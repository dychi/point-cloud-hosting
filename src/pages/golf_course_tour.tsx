import GolfCourseTourComponent from '../components/GolfCourseTour'

export default function GolfCourseTour() {
  return (
    <>
      <GolfCourseTourComponent />
      <section style={{ top: 0, left: 0 }}>
        <h2>Section: コンテンツ</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <button onClick={() => console.log('hello')}> button </button>
      </section>
    </>
  )
}
