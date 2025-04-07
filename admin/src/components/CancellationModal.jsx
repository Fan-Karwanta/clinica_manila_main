import React, { useState } from 'react';

const CancellationModal = ({ isOpen, onClose, onConfirm, title = "Cancel Appointment" }) => {
  const [reason, setReason] = useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = () => {
    onConfirm(reason);
    setReason(''); // Reset the reason after submission
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-5 border-b">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        
        <div className="p-5">
          <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-2">
            Please provide a reason for cancellation:
          </label>
          <textarea
            id="cancellation-reason"
            rows="4"
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            placeholder="Enter cancellation reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          ></textarea>
          <p className="mt-2 text-sm text-gray-500">
            This reason will be visible to the patient in their appointment history.
          </p>
        </div>
        
        <div className="px-5 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={handleSubmit}
            disabled={!reason.trim()}
          >
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;
