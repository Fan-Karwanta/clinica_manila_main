import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { Link } from 'react-router-dom'
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa'
import Modal from 'react-modal'

// Set the app element for accessibility
Modal.setAppElement('#root')

const DoctorsList = () => {
  const { doctors, changeAvailability, aToken, getAllDoctors, deleteDoctor } = useContext(AdminContext)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }
  }, [aToken, getAllDoctors])

  const handleDeleteClick = (doctor) => {
    setDoctorToDelete(doctor)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!doctorToDelete) return
    
    setIsDeleting(true)
    try {
      const success = await deleteDoctor(doctorToDelete._id)
      if (success) {
        setDeleteModalOpen(false)
        setDoctorToDelete(null)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setDoctorToDelete(null)
  }

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.name_extension && doctor.name_extension.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className='m-5 max-h-[90vh] overflow-y-auto'>
      <div className="flex justify-between items-center mb-5">
        <h1 className='text-xl font-medium'>All Doctors</h1>
        <Link 
          to="/add-doctor" 
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md"
        >
          Add New Doctor
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or speciality..."
          className="w-full md:w-1/3 px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speciality
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full object-cover" src={doctor.image} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {doctor.name} {doctor.name_extension && <span className="text-gray-500">{doctor.name_extension}</span>}
                          </div>
                          <div className="text-sm text-gray-500">{doctor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.speciality}</div>
                      <div className="text-sm text-gray-500">{doctor.degree}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.experience}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.doc_lic_ID || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => changeAvailability(doctor._id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doctor.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {doctor.available ? (
                          <>
                            <FaCheck className="mr-1" />
                            Available
                          </>
                        ) : (
                          <>
                            <FaTimes className="mr-1" />
                            Unavailable
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/edit-doctor/${doctor._id}`}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 p-2 rounded-full"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(doctor)}
                          className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? "No doctors match your search" : "No doctors found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onRequestClose={cancelDelete}
        contentLabel="Delete Doctor Confirmation"
        className="max-w-md mx-auto mt-40 bg-white rounded-lg shadow-lg p-6"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20"
        style={{
          overlay: {
            zIndex: 1000
          },
          content: {
            maxHeight: '200px'
          }
        }}
      >
        <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
        <p className="mb-6">
          Are you sure you want to delete Dr. {doctorToDelete?.name}? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={cancelDelete}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default DoctorsList