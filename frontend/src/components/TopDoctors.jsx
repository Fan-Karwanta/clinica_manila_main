import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const TopDoctors = () => {
    const navigate = useNavigate()
    const { doctors } = useContext(AppContext)

    return (
        <div className='flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10'>
            <h1 className='text-3xl font-medium'>Doctors to Book</h1>
            <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of trusted doctors.</p>
            <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pt-5 px-3 sm:px-0'>
                {doctors.slice(0, 8).map((item, index) => (
                    <div 
                        onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
                        className='w-full max-w-[300px] mx-auto border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 shadow-sm' 
                        key={index}
                    >
                        <div className='w-full h-[300px] relative bg-[#EAEFFF]'>
                            <img 
                                className='absolute inset-0 w-full h-full object-cover object-center' 
                                src={item.image} 
                                alt={item.name}
                                loading="lazy"
                            />
                        </div>
                        <div className='p-5 bg-white'>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${item.available ? 'text-green-500 bg-green-50' : "text-gray-500 bg-gray-50"}`}>
                                <div className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></div>
                                <span>{item.available ? 'Available' : "Not Available"}</span>
                            </div>
                            <h3 className='mt-3 text-[#262626] text-lg font-medium truncate'>Dr. {item.name} {item.name_extension && <span className="text-gray-500">{item.name_extension}</span>}</h3>
                            <p className='text-[#5C5C5C] text-sm mt-1'>{item.speciality}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button 
                onClick={() => { navigate('/doctors'); scrollTo(0, 0) }} 
                className='bg-[#EAEFFF] text-gray-600 px-12 py-3 rounded-full mt-10 hover:bg-[#d3dcff] transition-all'
            >
                More Doctors...
            </button>
        </div>
    )
}

export default TopDoctors