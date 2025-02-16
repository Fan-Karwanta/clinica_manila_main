import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <div>

      <div className='text-center text-2xl pt-10 text-[#707070]'>
        <p>CONTACT <span className='text-violet-700 font-semibold'>US</span></p>
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm'>
        <img className='w-full md:max-w-[360px]' src={assets.contact_image} alt="" />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className=' font-semibold text-lg text-gray-600'>OUR OFFICE</p>
          <p className=' text-gray-500'>Poblacion, <br />  General Santos City</p>
          <p className=' text-gray-500'>Tel: 0927-171-199-48 <br /> Email: clinica_manila@gmail.com</p>
          <p className=' font-semibold text-lg text-gray-600'>Learn More About Us</p>
          <p className=' text-gray-500'>Learn more about Clinica Manila and it's development.</p>
          <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500'>Learn More</button>
        </div>
      </div>

    </div>
  )
}

export default Contact
