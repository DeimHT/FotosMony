import NavBar from './components/NavBar'
import Hero from './sections/Hero'
import Services from './sections/Services'
import Testimonials from './sections/Testimonials'
import Footer from './components/Footer'
import './index.css'

function App() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <Services />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}

export default App
