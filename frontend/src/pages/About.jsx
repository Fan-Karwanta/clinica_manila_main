import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
        <div className='text-center text-2xl pt-10 text-gray-500'>
            <p>ABOUT <span className='text-violet-700 font-medium'>CLINICA MANILA</span></p>
        </div>
        <div className='my-10 flex flex-col md:flex-row gap-12'>
            <img className='w-full md:max-w-[360px]' src={assets.contact_image} alt="" />
            <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
                <p>Welcome to Clinica Manila, Your Trusted Partner in Simplifying Hospital Appointments and Enhancing Healthcare Access.
                At Clinica Manila, we understand the challenges individuals face when scheduling doctor appointments and managing their medical records. Our platform is designed to provide a seamless and efficient experience, ensuring that healthcare is always within your reach.
                </p>
                <p>Clinica Manila is Committed to Excellence in Healthcare Technology.
                We continuously enhance our platform by integrating the latest advancements to improve user experience and deliver superior service. Whether you're booking your first appointment or managing ongoing care, Clinica Manila is here to support you every step of the way.
                </p>
                <b className='text-gray-800'>Our Vision</b>
                <p>We aim to bridge the gap between patients and healthcare providers, making it easier for you to access the medical care you need—whenever and wherever you need it.
                </p>
            </div>
        </div>
        <div className='text-xl my-4'>
            <p>WHY <span className='text-gray-700 font-semibold'>CHOOSE US</span></p>
        </div>
        <div className='flex flex-col md:flex-row mb-20'>
            <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                <b>EFFICIENCY:</b>
                <p>Streamlined Appointment Scheduling That Fits Into Your Busy Lifestyle.</p>
            </div>
            <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                <b>CONVENIENCE:</b>
                <p>Access To A Network Of Trusted HealthCare Professionals In Your Area.</p>
            </div>
            <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
                <b>PERSONALIZATION:</b>
                <p>Tailored Recommenations And Remainders To Help You Stay On Top Of Your Health.</p>
            </div>
        </div>
    </div>
  )
}

export default About
