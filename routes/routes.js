const express = require("express");
const app = express.Router();
const controller = require("../controllers/myBooking");
const authentication = require("../middleaware/authMiddleware");
const path = require("path");
// Express route for executing stored procedure
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });
// console.log("storage -->", storage);

app.post("/getDataByName", controller.getDataByName);

app.get("/getData", controller.getAllData);

//Customer Registration..
app.post("/customerRegistration", controller.customerRegistration);

//Business Registration..
app.post(
  "/businessRegistrationAndPersonalInformation",
  upload.single("imgFile"),
  controller.businessRegistrationAndPersonalInformation
);

//login as customer or business
app.post("/login", controller.customerAndBusinessLogin);
//Get All Business Categories
app.get("/businessCategories", controller.getBusinessCategories);

//forgot account password api
app.post("/forgotAccountPassword", controller.forgotAccountPassword);

//get business data for admin
app.get("/businessData", controller.getBusinessData);

//get customer data for admin
app.get("/customerData", controller.getCustomerData);

//disable customer or business to stop theire services..
app.post(
  "/disableOrEnableServices",
  controller.disableOrEnableBusinessOrCustomerServices
);

// admin disable the services of business or customer.
app.post(
  "/multipleDisableOrEnableRecords",
  controller.multipleDisableOrEnableRecords
);

//insert business services.
app.post(
  "/addBusinessServices",
  authentication,
  upload.array("imgFile"),
  controller.AddBusinessServicesBusDash
);
//get business services.
app.post(
  "/getBusinessServices",
  authentication,
  controller.getBusinessServices
);

//delete selected row in business dashboard/business service page..
app.post(
  "/deleteSelectedRowBusDashBusServicePage",
  authentication,
  controller.deleteSelectedBusDashBusService
);

//delete multiple selected row in business dashboard/business service page..
app.post(
  "/deleteMultipleSelectedRowBusDashBusServicePage",
  authentication,
  controller.multipleDeleteRecordsBusDashBusService
);

//update data on selected record in business dash/business service
app.post(
  "/updateRecordOnSelectedRowBusDashBusServicePage",
  authentication,
  upload.single("imgFile"),
  controller.updatedRecordOnselectedBusiessServiceRow
);

//get country list
app.get("/getCoutryList", controller.getCountryList);

//get states list based on country
app.post("/getStateListByCountry", controller.getStateListByCountry);

//get city list based on state
app.post("/getCityListByState", controller.getCityListByState);

//business list by current location
app.post(
  "/businessListByCurrentLocation",
  authentication,
  controller.getBusinessListByLocation
);

//book an appointment
app.post("/bookAppointment", authentication, controller.bookAppointment);

//get booked slot list
app.post("/getBookedSlotList", authentication, controller.getBookedSlotList);

//update state when business owner shown notification modal
app.post(
  "/updateNotificationStatus",
  authentication,
  controller.updateNotificationBadgeOnModalClose
);

//get appointment list for customer
app.post(
  "/getCustomerAppointmentList",
  authentication,
  controller.getCustomerAppointmentList
);

//get slot list for business to confirm slot
app.post(
  "/getSlotListForBusinessToConfirmSlot",
  authentication,
  controller.getSlotListForBusiness
);

//accept or decline slot by business owner.
app.post(
  "/acceptOrDeclineSlotByBusiness",
  authentication,
  controller.handleAcceptOrDeclineSlot
);

//accept online payment from customer
app.post("/payment", authentication, controller.onlinePaymentFromCustomer);

//get payment list for customer
app.post("/getPaymentList", authentication, controller.getPaymentList);
//get payment list for  business
app.post(
  "/getPaymentListForBusiness",
  authentication,
  controller.getPaymentListForBusiness
);

//change payment status of customer when select cash payment
app.post(
  "/changePaymentStatusOnCash",
  authentication,
  controller.changePaymentStatusOfCustomerOnCashMode
);

//change payment status to Done when business collected cash from customer
app.post(
  "/paymentStatusDoneIfCashCollectedByBusiness",
  authentication,
  controller.cashPaymentCollectedByBusiness
);

// get feedback from customer for service.
app.post(
  "/feedbackFromCustomer",
  authentication,
  controller.takeFeedbackFromCustomer
);

//get feedback list for business
app.post(
  "/getFeedbackListForBusiness",
  authentication,
  controller.getFeedbackListForBusiness
);

//store business response for customer feedback
app.post(
  "/storeResponseOfBusinessForCustomer",
  authentication,
  controller.businessResponseForCustomerFeedback
);

//get feedback list for customer
app.post(
  "/getFeedbackListForCustomer",
  authentication,
  controller.getFeedbackListForCustomer
);

//get customer data by id for edit profile
app.post(
  "/getCustomerDataById",
  authentication,
  controller.getCustomerDataByIDForEditProfile
);

//update customer profile data
app.post(
  "/updateCustomerProfileData",
  authentication,
  controller.updateCustomerProfileData
);

//get business data & business owner detais for edit
app.post(
  "/getBusinessInfoForEditProfile",
  authentication,
  controller.getBusinessDataAndPersonalInfoForEditProfile
);

//update business data & its personal information
app.post(
  "/updateBusinessProfileData",
  authentication,
  upload.single("imgFile"),
  controller.updateBusinessProfile
);
//get business services filter by customer.
app.post(
  "/getBusinessServicesByCustomerFilter",
  authentication,
  controller.getBusinessServicesByCustomerFilter
);

//apply discount on business service by business 
app.post("/applyDiscountOnBusinessService", authentication, controller.applyDiscountOnBusinessServices)

//get filter price, review & dicount static data for user that user can filter the business service
app.get("/getFilterDataForCustomerToFilterService", authentication, controller.getStaticFilterDataForCustomer)

//get discount list of business. 
app.post("/getDiscountListForBusiness", authentication, controller.getDiscountListForBusiness)

module.exports = app;
