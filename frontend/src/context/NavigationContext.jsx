import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Create the navigation context
const NavigationContext = createContext();

// Custom provider component
export const NavigationProvider = ({ children }) => {
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [navigationBlockers, setNavigationBlockers] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Register a navigation blocker
  const registerBlocker = useCallback((id, shouldBlock) => {
    setNavigationBlockers(prev => [...prev.filter(blocker => blocker.id !== id), { id, shouldBlock }]);
    
    // Return a function to unregister the blocker
    return () => {
      setNavigationBlockers(prev => prev.filter(blocker => blocker.id !== id));
    };
  }, []);

  // Check if navigation should be blocked
  const shouldBlockNavigation = useCallback(() => {
    return navigationBlockers.some(blocker => blocker.shouldBlock());
  }, [navigationBlockers]);

  // Custom navigation function that checks for blockers
  const navigateSafely = useCallback((to) => {
    // If current path is the same as target, no need to block
    if (location.pathname === to) {
      navigate(to);
      return;
    }
    
    // Check if any component wants to block navigation
    if (shouldBlockNavigation()) {
      setPendingNavigation(to);
      setShowNavigationWarning(true);
      return;
    }
    
    // If no blockers, navigate directly
    navigate(to);
  }, [navigate, location.pathname, shouldBlockNavigation]);

  // Confirm navigation after warning
  const confirmNavigation = useCallback(() => {
    setShowNavigationWarning(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [navigate, pendingNavigation]);

  // Cancel navigation
  const cancelNavigation = useCallback(() => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  }, []);

  // Context value
  const contextValue = {
    navigateSafely,
    registerBlocker,
    showNavigationWarning,
    pendingNavigation,
    confirmNavigation,
    cancelNavigation
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
      
      {/* Navigation Warning Modal */}
      {showNavigationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Discard Changes?</h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. If you leave this page, your changes will be lost.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Discard & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
};

// Custom hook to use the navigation context
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Custom hook to create a navigation blocker
export const useNavigationBlocker = (shouldBlock) => {
  const { registerBlocker } = useNavigation();
  
  React.useEffect(() => {
    // Generate a unique ID for this blocker
    const blockerId = Math.random().toString(36).substring(2, 9);
    
    // Register the blocker and get the unregister function
    const unregister = registerBlocker(blockerId, shouldBlock);
    
    // Clean up when the component unmounts
    return unregister;
  }, [registerBlocker, shouldBlock]);
};
