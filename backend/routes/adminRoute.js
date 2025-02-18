import express from 'express';
import { 
    loginAdmin, 
    appointmentsAdmin, 
    appointmentCancel, 
    allDoctors,
    adminDashboard,
    getPendingRegistrations,
    updateApprovalStatus,
    approveAppointment,
    addDoctor
} from '../controllers/adminController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';

const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.put("/appointment-cancel/:appointmentId", authAdmin, appointmentCancel);
adminRouter.put("/appointment-approve/:appointmentId", authAdmin, approveAppointment);
adminRouter.get("/all-doctors", authAdmin, allDoctors);
adminRouter.get("/dashboard", authAdmin, adminDashboard);

// New routes for handling user registrations
adminRouter.get('/pending-registrations', authAdmin, getPendingRegistrations);
adminRouter.put('/update-approval/:userId', authAdmin, updateApprovalStatus);

adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor);

export default adminRouter;