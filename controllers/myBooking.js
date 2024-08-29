const sql = require("mssql");
require("dotenv").config();
const configuration = require("../db/connection");
const stripe = require("stripe")(
  "sk_test_51Ou7hVSHWJzx2Qu4PxIZQHRaMCx8RSR41gKZh195kqYRCtydHDq1ygBxmRpI4K7FMiZEDaIGS0c0EBAVCm6imzVe00mXXHsCwb"
);
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const getAllData = async (req, res) => {
  try {
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetAllData`);

    res.status(200).send(result);
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
  } finally {
    await sql.close();
  }
};

const getDataByName = async (req, res) => {
  try {
    const { name } = req.body;
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetAllData ${name}`);

    res.status(200).send(result);
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
  } finally {
    await sql.close();
  }
};

// KTL Booking Controllers.

//Get Business Categories
const getBusinessCategories = async (req, res) => {
  try {
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetAllBusinessCategories`);
    res.status(200).send(result);
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  }
};

//Get Business Services
const getBusinessServices = async (req, res) => {
  console.log("hello service=>", req.body);
  try {
    const { value, flag } = req.body;
    const pool = await sql.connect(configuration);
    // console.log("pool", pool);
    const result = await pool
      .request()
      .query(`exec spGetBusinessServicesData ${value}, ${flag}`);
    if (result.recordset.length > 0) {
      res.status(200).send(result);
    } else {
      res.send({ message: "Service Not Found" });
    }
  } catch (e) {
    console.log("error", e);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//Customer Registration..
const customerRegistration = async (req, res) => {
  try {
    const {
      email,
      location,
      password,
      phoneNumber,
      userName,
      country,
      state,
      city,
    } = req.body;
    // console.log("req body", req.body);

    //store hash password in backend.
    let hashedPassword = await bcrypt.hash(password, 10);

    console.log("register haspassword", hashedPassword, typeof hashedPassword);
    console.log("register original password", password, typeof password);

    await sql.connect(configuration);
    const result = await sql.query(
      `exec spCustomerRegistration '${userName}', '${email}', '${hashedPassword}', '${location}', '${phoneNumber}', ${country}, ${state}, ${city}`
    );
    console.log("result", result);
    if (result.recordset[0][""] == "Email Already Exists") {
      res.status(201).send("Email Already Exist");
      // console.log("result", result);
    }
    if (result.recordset[0][""] == "1") {
      // console.log("result ", result);
      res.status(200).send("Customer Registration Sucessfull!");
    }
  } catch (e) {
    console.log("error", e);
    res.send("Customer Registration Unsucessfull!");
  } finally {
    await sql.close();
  }
};

//Business Registration & business-owner information.
const businessRegistrationAndPersonalInformation = async (req, res) => {
  try {
    console.log("req body business", req.body);
    const {
      location,
      longitude,
      openTime,
      password,
      phoneNumber,
      selectDay,
      email,
      latitude,
      closeTime,
      busiessCategory,
      businessName,
      boName,
      boLocation,
      boPhoneNumber,
    } = req.body;

    //store hash password in backend.
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(
      "register haspassword business",
      hashedPassword,
      typeof hashedPassword
    );
    console.log(
      "register original password business",
      password,
      typeof password
    );

    const imgFile = req.file;
    console.log("business image", imgFile);
    console.log("req body for business info", req.body);
    //concate latitude & longitude

    const lat_long = `${latitude},${longitude}`;

    //concate openTime & closeTime
    const businessHour = `${openTime}-${closeTime}`;

    //selectDay convert into string with comma..
    let selectedBusinessDayList = [];
    for (let index = 0; index < selectDay.length; index++) {
      selectedBusinessDayList[index] = selectDay[index].value;
    }
    let businessDayAsString = selectedBusinessDayList.join();

    //only businessCategory's value will be go.. rather then it's object
    // console.log("business category", typeof busiessCategory);
    let busiessCategoryValue = parseInt(busiessCategory);

    // console.log("req body", req.body);
    await sql.connect(configuration);
    const result = await sql.query(
      `exec spBusinessRegistration '${businessName}', '${email}', '${hashedPassword}', '${location}', '${phoneNumber}', '${businessDayAsString}', '${businessHour}', '${lat_long}' ,'${busiessCategoryValue}', '${boName}', '${boLocation}', '${boPhoneNumber}', '${imgFile.filename}' `
    );
    if (result.recordset[0][""] == "Email Already Exists") {
      res.status(201).send("Email Already Exist");
      // console.log("result", result);
    } else {
      // console.log("result ", result);
      res.status(200).send({
        message: "Business Register Sucessfully",
        businessID: result.recordset[0][""],
      });
    }
  } catch (e) {
    console.log("error", e);
    res.send("Business Registration Unsucessfull!");
  } finally {
    await sql.close();
  }
};

// customer login or business login
const customerAndBusinessLogin = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    console.log("req body", req.body);
    await sql.connect(configuration);
    const result = await sql.query(`exec spLogin  '${emailAddress}'`);

    console.log("login result", result);
    if (result.recordset[0][""] == "Email or Password not Valid") {
      res.status(401).send("Credentials is invalid");
      // console.log("result", result);
    } else {
      // const hashedPasswordFromDB = result.recordset[index].password;
      if (result.recordset && result.recordset.length > 1) {
        if (
          (result.recordset[0]?.role_id == 3 &&
            result.recordset[1]?.role_id == 2) ||
          (result.recordset[0]?.role_id == 2 &&
            result.recordset[1]?.role_id == 3)
        ) {
          const userEnteredPassword = password;
          const dbPassword1 = result.recordset[0]?.password;
          const dbPassword2 = result.recordset[1]?.password;
          const match = await bcrypt.compare(userEnteredPassword, dbPassword1);
          const match1 = await bcrypt.compare(userEnteredPassword, dbPassword2);
          // console.log("match & match1 ", match, match1);
          if (match && match1) {
            const tokenForCustomer = jwt.sign(
              { customerID: result.recordset[0]?.id },
              process.env.JWT_SECRET_KEY,
              {
                expiresIn: "1h",
              }
            );
            const tokenForBusiness = jwt.sign(
              { businessID: result.recordset[1]?.id },
              process.env.JWT_SECRET_KEY,
              {
                expiresIn: "1h",
              }
            );
            res.status(200).send({
              flag: "1",
              message: "Login as Business or Customer",
              roleId1: result.recordset[0]?.role_id,
              roleId2: result.recordset[1]?.role_id,
              tmpId1: result.recordset[0]?.id,
              tmpId2: result.recordset[1]?.id,
              tokenForCustomer,
              tokenForBusiness,
            });
            console.log("login as Business or Customer -->" ,   result.recordset[0]?.id,result.recordset[1]?.id );
            return;
          } else {
            res.status(401).send({
              flag: "1",
              message: "Invalid Credentials",
              Id: result.recordset[0]?.id,
            });
            return;
          }
        }
      } else if (result.recordset[0]?.role_id == 2) {
        const oldPassword = password;
        const newPassword = result.recordset[0]?.password;
        const match = await bcrypt.compare(oldPassword, newPassword);
        console.log("password", match);
        if (match) {
          const token = jwt.sign(
            { busID: result.recordset[0]?.id },
            process.env.JWT_SECRET_KEY,
            {
              expiresIn: "60s",
            }
          );
          res.status(200).send({
            flag: "2",
            message: "Login as Business",
            Id: result.recordset[0]?.id,
            token,
          });
          console.log("login as Business -->", recordset[0]?.id);
          return;
        } else {
          res.status(401).send({
            flag: "2",
            message: "Invalid Credentials",
            Id: result.recordset[0]?.id,
          });
          return;
        }
      } else if (result.recordset[0]?.role_id == 3) {
        const oldPassword = password;
        const newPassword = result.recordset[0]?.password;
        const match = await bcrypt.compare(oldPassword, newPassword);
        console.log("password", match);
        if (match) {
          const token = jwt.sign(
            { cusID: result.recordset[0]?.id },
            process.env.JWT_SECRET_KEY,
            {
              expiresIn: "1h",
            }
          );
          res.status(200).send({
            flag: "3",
            message: "Login as Customer",
            Id: result.recordset[0]?.id,
            token,
          });
          console.log("login as Customer");
          return;
        } else {
          res.status(401).send({
            flag: "3",
            message: "Invalid Credentials",
            Id: result.recordset[0]?.id,
          });
          return;
        }
      }
    }
  } catch (e) {
    console.log("error", e);
    res.send("Login Unsucessful!");
  } finally {
    await sql.close();
  }
};

//forgot account password
const forgotAccountPassword = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    // console.log("req body", req.body);

    let hashedPassword = await bcrypt.hash(password, 10);
    await sql.connect(configuration);
    const result = await sql.query(
      `exec spForgotPassword  '${emailAddress}', '${hashedPassword}'`
    );
    if (result.recordset[0][""] == "1") {
      // console.log("result ", result);
      res.status(200).send("password changed sucessfully!");
      return;
    } else {
      res.status(501).send("Email is not valid");
      // console.log("result", result);
      return;
    }
  } catch (e) {
    console.log("error", e);
    res.send("error occur while changing password");
  } finally {
    await sql.close();
  }
};

//get business data for admin
const getBusinessData = async (req, res) => {
  try {
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetBusinessData`);
    res.status(200).send(result);
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};

//get customer data for admin
const getCustomerData = async (req, res) => {
  try {
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetCustomerData `);
    res.status(200).send(result);
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};

//admin disable the services of business or customer.
const disableOrEnableBusinessOrCustomerServices = async (req, res) => {
  try {
    var result;
    const { data } = req.body;
    const { email, flag, disable } = data;
    await sql.connect(configuration);

    if (disable == "true") {
      result = await sql.query(
        `exec spDisableBusinessOrCustomer '${email}', '${flag}', 'true'`
      );
    } else {
      result = await sql.query(
        `exec spDisableBusinessOrCustomer '${email}', '${flag}', 'false'`
      );
    }
    // console.log("result", result);
    if (result.recordset[0][""] == "1") {
      res.status(200).send("Customer Services Disable Sucessfully!");
      return;
    } else if (result.recordset[0][""] == "2") {
      res.status(200).send("Business Services Disable Sucessfully!");
      return;
    } else if (result.recordset[0][""] == "3") {
      res.send("Customer or Business Services Not Disabled!!");
      return;
    } else if (result.recordset[0][""] == "4") {
      res.send("Customer Services Enable Sucessfully!");
      return;
    } else if (result.recordset[0][""] == "5") {
      res.status(200).send("Business Services Enable Sucessfully!");
      return;
    } else if (result.recordset[0][""] == "6") {
      res.send("Customer or Business Services Not Enabled!!");
      return;
    }
  } catch (e) {
    console.log("err", e);
    res.status(404).send("Customer or Business Not Found");
  } finally {
    await sql.close();
  }
};

const multipleDisableOrEnableRecords = async (req, res) => {
  try {
    const { listOfEmails, disable, roleId } = req.body;
    // console.log("list of emails", listOfEmails, disable);
    await sql.connect(configuration);

    const emailString = listOfEmails.join(",");
    // console.log("emailString", emailString);
    if (disable == "true") {
      result = await sql.query(
        `exec spMultipleDisableOrEnablenRecords '${emailString}', '${roleId}', 'true'`
      );
    } else {
      result = await sql.query(
        `exec spMultipleDisableOrEnablenRecords '${emailString}', '${roleId}', 'false'`
      );
    }
    // admin disable the services of business or customer.
    // console.log("result", result);
    if (result.recordset[0][""] == "1") {
      res.status(200).send("Customer Records Disable Sucessfully!");
      return;
    } else if (result.recordset[0][""] == "2") {
      res.status(200).send("Business Records Disable Sucessfully!");
      return;
    } else if (result.recordset[0][""] == "3") {
      res.send("Customer or Business Records Not Disabled!!");
      return;
    } else if (result.recordset[0][""] == "4") {
      res.send("Customer Records Enable Sucessfully!");
      return;
    } else if (result.recordset[0][""] == "5") {
      res.status(200).send("Business Records Enable Sucessfully!");
      return;
    } else if (result.recordset[0][""] == "6") {
      res.send("Customer or Business Records Not Enabled!!");
      return;
    }
  } catch (e) {
    console.log("err", e);
    res.status(404).send("Customer or Business Records Not Found");
  } finally {
    await sql.close();
  }
};

//Add Business Services
const AddBusinessServicesBusDash = async (req, res) => {
  try {
    const { imgName, imgPrice, shortDesc, longDesc } = req.body;

    console.log("req body", req.body);
    const files = req.files;
    // Access each image using the unique keys
    console.log(`File:`, files);

    let finalData = [];
    files.map((values, index) => {
      // console.log("values", values);
      const obj = {};
      obj["file"] = values.filename;
      obj["name"] = Array.isArray(imgName)
        ? imgName[index].trim()
        : imgName.trim();
      obj["price"] = Array.isArray(imgPrice) ? imgPrice[index] : imgPrice;
      obj["shortDesc"] = Array.isArray(shortDesc)
        ? shortDesc[index]
        : shortDesc;
      obj["longDesc"] = Array.isArray(longDesc) ? longDesc[index] : longDesc;
      finalData.push(obj);
    });
    console.log("final data =>", finalData);

    // res.status(200).json({ message: "Files processed successfully" });
    await sql.connect(configuration);
    let servicesInfo = [];
    for (const data of finalData) {
      const { file, name, price, shortDesc, longDesc } = data;
      servicesInfo.push({
        imgFile: file,
        imgName: name,
        business_id: req.body.value,
        price: price,
        serviceShortDesc: shortDesc,
        serviceLongDesc: longDesc,
      });
    }

    //create table value parameter structure to pass multiple records
    const table = new sql.Table("tbl_business_services_info");
    table.columns.add("imgFile", sql.NVarChar(255));
    table.columns.add("imgName", sql.NVarChar(255));
    table.columns.add("price", sql.NVarChar(255));
    table.columns.add("business_id", sql.Int);
    table.columns.add("short_desc", sql.NVarChar(200));
    table.columns.add("long_desc", sql.NVarChar(200));
    //add data in columns
    servicesInfo.forEach(
      ({
        imgFile,
        imgName,
        price,
        business_id,
        serviceShortDesc,
        serviceLongDesc,
      }) => {
        table.rows.add(
          imgFile,
          imgName,
          price,
          business_id,
          serviceShortDesc,
          serviceLongDesc
        );
      }
    );
    console.log("final table send to db", table);
    const request = new sql.Request();
    request.input("data", sql.TVP("dbo.tbl_business_services_info"), table);

    const result = await request.execute(`spBusinessServices`);
    console.log("hello =>", result);
    if (result.recordset[0]["DuplicateService"] != null) {
      res
        .status(201)
        .send({ message: result.recordset[0]["DuplicateService"] });
    } else {
      res.status(200).send({ message: "service inserted" });
    }
  } catch (e) {
    console.log("error", e);
    res.send("Business Services Not Inserted!");
  } finally {
    await sql.close();
  }
};

//delete selected record in business dashboard/business services
const deleteSelectedBusDashBusService = async (req, res) => {
  const { data } = req.body;
  const { deleteRecordID } = data;
  console.log("id", deleteRecordID);
  try {
    await sql.connect(configuration);
    const result = await sql.query(
      `exec spDeleteRecordsBusDashBusService '${deleteRecordID}'`
    );
    console.log("result of service deleted", result);
    if (result.recordset[0][""] == "2") {
      res.status(404).send("Record Not Deleted at This ID");
      return;
    } else {
      res.status(200).send("Record Deleted Sucessfully");
      return;
    }
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};

//multiple selected record will be delete business dash/ business service
const multipleDeleteRecordsBusDashBusService = async (req, res) => {
  try {
    const { listOfID } = req.body;
    // console.log("list of emails", listOfEmails, disable);
    await sql.connect(configuration);

    const idString = listOfID.join(",");
    console.log("ID String", idString);
    result = await sql.query(
      `exec spMultipleDeleteRecordsBusDashBusService '${idString}' `
    );
    console.log("result", result);
    if (result.recordset[0][""] == "2") {
      res.status(200).send("Services Not Deleted");
      return;
    } else {
      res.status(200).send("Services Deleted Sucessfully!");
      return;
    }
  } catch (e) {
    console.log("err", e);
    res.status(404).send("Records Not Found");
  } finally {
    await sql.close();
  }
};

//change data of service by business
const updatedRecordOnselectedBusiessServiceRow = async (req, res) => {
  try {
    const {
      imgName,
      imgPrice,
      rowID,
      businessID,
      shortDesc,
      longDesc,
      alreadyStoredImage,
    } = req.body;
    console.log("req body for update business service", req.body);
    // console.log("hello 1", req.body);
    const file = req.file;
    console.log("file", file);

    let splittedImgFile = alreadyStoredImage
      ? alreadyStoredImage.split("uploads/")
      : "";
    let fileSendToDB;
    if (file == undefined) {
      fileSendToDB = splittedImgFile[1];
      // console.log("hello imgFile here");
    } else {
      fileSendToDB = file.filename;
    }
    console.log('business iDDDDDD', typeof businessID);
    const id = parseInt(rowID);
    const b_id = parseInt(businessID);
    await sql.connect(configuration);
    console.log("file send to db", fileSendToDB);
    const result = await sql.query(
      `exec spUpdateSelectedRecordBusDashBusService '${fileSendToDB}', '${imgName}', '${imgPrice}', '${id}', 
      '${b_id}', '${shortDesc}', '${longDesc}'`
    );

    if (result.recordset[0][""] == "2") {
      res.status(404).send("Data Not Found");
    } else if (result.recordset[0][""] == "3") {
      res.status(201).send("Name Already Exist");
    } else {
      res.status(200).send("Data Updated Sucessfully");
    }
  } catch (e) {
    // res.send("err", e);
    res.status(500).send("Data Not Updated!");
  } finally {
    await sql.close();
  }
};

//get country list
const getCountryList = async (req, res) => {
  try {
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetCountriesData`);
    res.status(200).send(result);
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};

//get state list based on country
const getStateListByCountry = async (req, res) => {
  try {
    const { countryID } = req.body;
    await sql.connect(configuration);
    const result = await sql.query(
      `exec spGetStateListByCountryID '${countryID}'`
    );
    res.status(200).send(result);
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};
//get city list based on state
const getCityListByState = async (req, res) => {
  try {
    const { stateID } = req.body;
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetCityListByStateID '${stateID}'`);
    res.status(200).send(result);
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};

//get business list by location. ---- finally block is not here.
const getBusinessListByLocation = async (req, res) => {
  try {
    const { latitude, longitude, businessCategoryID } = req.body;
    await sql.connect(configuration);
    const result = await sql.query(
      `exec spGetBusinessListByLocation ${latitude}, ${longitude}, ${businessCategoryID}`
    );
    console.log("business list by location", result);
    res.status(200).send(result);
  } catch (e) {
    res.status(404).send("Business Not Found");
  }
};

//book time & date appointment by customer.   -- finally block is not here.
const bookAppointment = async (req, res) => {
  try {
    console.log("book appointment", req.body);
    const {
      slotTime,
      slotDate,
      businessID,
      customerID,
      serviceName,
      serviceID,
      price,
    } = req.body;
    await sql.connect(configuration);
    const result = await sql.query(
      `exec spBookAppointment '${slotTime}', '${slotDate}', '${customerID}', '${businessID}', '${serviceName}', '${serviceID}', '${price}'`
    );
    if (result.recordset[0][""] == "1") {
      // console.log("result ", result);
      res.status(201).send({ message: "Slot is already booked" });
      return;
    } else if (result.recordset[0][""] == "2") {
      res.status(200).send({ message: "Select time in business defined hour" });
      return;
    } else if (result.recordset[0][""] == "3") {
      res.status(200).send({ message: "Select today's or future Date" });
    } else {
      res
        .status(200)
        .send({ message: "Request is Sent to Business for Confirmation" });
      return;
    }
  } catch (e) {
    res.status(404).send("Slot Not Booked");
  }
};

//get slot list booked by customer
const getBookedSlotList = async (req, res) => {
  try {
    const { value } = req.body;
    console.log("booked slot list businessID", value);
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetBookedSlotList '${value}'`);
    console.log("booked slot list", result);
    res.status(200).send(result);
  } catch (e) {
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};

//update notification status on notification badge modal close
const updateNotificationBadgeOnModalClose = async (req, res) => {
  try {
    const { value } = req.body;
    console.log("notification business id", value);
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spUpdateNotificationStatusOnModalClose '${value}' `
    );
    console.log("response for notification", response);
    if (response.data.recordset[0][""] == "1") {
      res.status(200).send({ message: "Notification is updated!" });
    }
  } catch (e) {
    res.send({ message: "Notification is not updated.." });
  } finally {
    await sql.close();
  }
};

//get appointment data of customer
const getCustomerAppointmentList = async (req, res) => {
  try {
    const { value } = req.body;
    console.log("appointment list customer id", req.body);
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spGetCustomerAppointmentList '${value}' `
    );
    // console.log("response for appointment list", response);
    res.status(200).send(response);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching customer appointment list");
  } finally {
    await sql.close();
  }
};
//get appointment data of business to confirm slot
const getSlotListForBusiness = async (req, res) => {
  try {
    const { value } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spGetAppointmentForBusinessToConfirmSlot '${value}' `
    );
    // console.log("response for appointment list", response);
    res.status(200).send(response);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching customer appointment list");
  } finally {
    await sql.close();
  }
};

//handle accept or decline customer slot by business
const handleAcceptOrDeclineSlot = async (req, res) => {
  try {
    const { appointment_ID, flag } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spHandleAcceptOrDeclineSlotByBusiness '${appointment_ID}', '${flag}'`
    );
    if (response.recordset[0][""] == "1") {
      res.status(200).send({ message: "Slot Booked Successfully" });
    } else if (response.recordset[0][""] == "2") {
      res.status(200).send({ message: "Slot is Rejected" });
    } else {
      res.send({ message: "Slot Not Booked Successfully" });
    }
  } catch (e) {
  } finally {
    await sql.close();
  }
};

//online customer payment status saved to database
const onlinePaymentFromCustomer = async (req, res) => {
  try {
    let { amount, id, appointmentID } = req.body;
    // console.log("amount & id", amount, id);
    const payment = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      description: "Payment",
      payment_method: id,
      return_url: "http://localhost:1001/#/slot-booked/customer-payment",
      confirm: true,
    });

    await sql.connect(configuration);
    const response = await sql.query(
      `exec spCustomerPaymentStatus'${appointmentID}' `
    );
    // console.log("respose of payment", response);
    if (response.recordset[0][""] == "1") {
      res.json({
        message: "Payment was successful",
        success: true,
      });
    }
  } catch (error) {
    console.log("Error", error);
    res.json({
      message: "Payment Failed",
      success: false,
    });
  } finally {
    await sql.close();
  }
};

//get payment list
const getPaymentList = async (req, res) => {
  try {
    const { customerID } = req.body;
    await sql.connect(configuration);

    const response = await sql.query(`exec spGetPaymentList '${customerID}'`);
    // console.log("response for appointment list", response);
    res.status(200).send(response);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching payment list");
  } finally {
    await sql.close();
  }
};

//display customer payment list to business
const getPaymentListForBusiness = async (req, res) => {
  try {
    const { businessID } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spGetPaymentListForBusiness '${businessID}' `
    );
    // console.log("response for appointment list", response);
    res.status(200).send(response);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching payment list for business");
  } finally {
    await sql.close();
  }
};
// change payment status of customer while selecting cash mode
const changePaymentStatusOfCustomerOnCashMode = async (req, res) => {
  try {
    const { appointmentID } = req.body;
    // console.log("appoint id", appointmentID);
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spChangePaymentStatusOfCustomerOnCashMode '${appointmentID}'`
    );
    // console.log("res", response);
    // console.log("response for appointment list", response);
    if (response.recordset[0][""] == "1") {
      res.status(200).send({ message: "payment status updated" });
    }
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching payment list");
  } finally {
    await sql.close();
  }
};

//change payment status to Done when business collected cash from customer
const cashPaymentCollectedByBusiness = async (req, res) => {
  try {
    const { paymentID } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spCashAcceptedByBusinessFromCustomer '${paymentID}'`
    );
    if (response.recordset[0][""] == "1") {
      res.status(200).send({ message: "Cash Payment Done" });
    }
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching payment list");
  } finally {
    await sql.close();
  }
};

//send customer feedback to business
const takeFeedbackFromCustomer = async (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      business_id,
      business_name,
      service_name,
      rating_number,
      feedback,
    } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spFeedbackFromCustomer '${customer_id}', '${customer_name}', '${business_id}', '${business_name}', '${service_name}', '${rating_number}', '${feedback}'`
    );
    if (response.recordset[0][""] == "1") {
      res.status(200).send({ message: "Feedback Sent Successfully" });
    } else if (response.recordset[0][""] == "2") {
      res.status(200).send({ message: "Feedback Updated Successfully" });
    }
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while sending feedback to business");
  } finally {
    await sql.close();
  }
};

//get list of feedback for business
const getFeedbackListForBusiness = async (req, res) => {
  try {
    const { businessID } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spGetFeedbackListForBusiness '${businessID}' `
    );
    // console.log("response for appointment list", response);
    res.status(200).send(response);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching feedback list for business");
  } finally {
    await sql.close();
  }
};

//store business response for customer feedback
const businessResponseForCustomerFeedback = async (req, res) => {
  try {
    const { feedback_id, resFromBusiness } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spStoreBusinessResponseForCustomerFeedback '${feedback_id}', '${resFromBusiness}' `
    );

    if (response.recordset[0][""] == "1") {
      res.status(200).send({ message: "Response is Sent to Customer" });
    }
    // console.log("response for appointment list", response);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log(
      "Error occur while fetching storing business response for customer feedback"
    );
  } finally {
    await sql.close();
  }
};

//get list of feedback for customer
const getFeedbackListForCustomer = async (req, res) => {
  try {
    const { customerID } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spGetFeedbackListForCustomer '${customerID}' `
    );
    // console.log("response for appointment list", response);
    res.status(200).send(response);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching feedback list for customer");
  } finally {
    await sql.close();
  }
};
//get customer data by id that customer can edit profile
const getCustomerDataByIDForEditProfile = async (req, res) => {
  try {
    const { customerID } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spGetCustomerDataByIDForEditProfile '${customerID}' `
    );
    // console.log("response for appointment list", response);
    res.status(200).send(response);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching customer data by id");
  } finally {
    await sql.close();
  }
};
//update customer profile data
const updateCustomerProfileData = async (req, res) => {
  try {
    const {
      customerID,
      city,
      state,
      country,
      location,
      userName,
      phoneNumber,
    } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spUpdateCustomerProfileData '${customerID}', '${city}','${state}','${country}','${location}','${userName}','${phoneNumber}' `
    );
    // console.log("response for appointment list", response);
    if (response.recordset[0][""] == "1") {
      res.status(200).send({ message: "record saved successfully" });
      return;
    } else {
      res.status(404).send({ message: "record not found" });
      return;
    }
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while updating customer data by id");
  } finally {
    await sql.close();
  }
};

//get business data by id that business can edit profile
const getBusinessDataAndPersonalInfoForEditProfile = async (req, res) => {
  try {
    const { businessID } = req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spGetBusinessDataByIDForEditProfile '${businessID}' `
    );
    // console.log("business & perosnal info", response);
    const storeResponse = response.recordset[0];
    // console.log("stored response", storeResponse);
    const { lat_long, hour } = storeResponse;
    const openTime = hour.split("-")[0];
    const closeTime = hour.split("-")[1];
    const latitude = lat_long.split(",")[0];
    const longitude = lat_long.split(",")[1];

    delete storeResponse.lat_long;
    delete storeResponse.hour;

    storeResponse.openTime = openTime;
    storeResponse.closeTime = closeTime;
    storeResponse.latitude = latitude;
    storeResponse.longitude = longitude;

    // console.log("final data send to client", storeResponse);
    res.status(200).send(storeResponse);
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while fetching business data by id");
  } finally {
    await sql.close();
  }
};

//update business profile data
const updateBusinessProfile = async (req, res) => {
  try {
    const {
      boLocation,
      boName,
      boPhoneNumber,
      busiessCategory,
      businessID,
      businessName,
      closeTime,
      latitude,
      location,
      longitude,
      openTime,
      phoneNumber,
      selectDay,
    } = req.body;

    const imgFile = req.file;
    const lat_long = `${latitude},${longitude}`;
    //concate openTime & closeTime
    const businessHour = `${openTime}-${closeTime}`;

    //selectDay convert into string with comma..
    let selectedBusinessDayList = [];
    for (let index = 0; index < selectDay.length; index++) {
      selectedBusinessDayList[index] = selectDay[index].value;
    }
    let businessDayAsString = selectedBusinessDayList.join();

    //only businessCategory's value will be go.. rather then it's object
    let busiessCategoryValue = parseInt(busiessCategory);
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spUpdateBusinessProfileData '${businessID}', '${boName}', '${boLocation}', '${boPhoneNumber}', '${businessName}', '${location}',
      '${phoneNumber}', '${lat_long}', '${businessHour}', '${businessDayAsString}', '${busiessCategoryValue}', '${imgFile?.filename}' `
    );
    if (response.recordset[0][""] == "1" || response.recordset[0][""] == "2") {
      res.status(200).send({ message: "record saved successfully" });
      return;
    } else {
      res.status(404).send({ message: "record not saved" });
      return;
    }
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while updating business data by id");
  } finally {
    await sql.close();
  }
};

//get busines service filter by customer
const getBusinessServicesByCustomerFilter = async (req, res) => {
  try {
    debugger;
    const { priceFilter, reviewFilter, businessID, discountFilter } = req.body;
    console.log(
      "req body of customer filter",
      priceFilter,
      reviewFilter,
      businessID,
      discountFilter
    );
    let formattedPriceResult, formattedReviewResult, formattedDiscountResult;
    let startingPrice, endingPrice, ratingValue, discountValue;
    if (priceFilter) {
      formattedPriceResult = priceFilter.includes("-")
        ? priceFilter.split("-")
        : priceFilter.split(" ");
      startingPrice = formattedPriceResult[0].trim();
      endingPrice = formattedPriceResult[1].trim();

      startingPrice = startingPrice.includes("₹")
        ? startingPrice.replace("₹", "")
        : startingPrice.includes("under")
        ? "0"
        : "1";
      endingPrice = endingPrice.replace("₹", "");
    } else {
      (startingPrice = ""), (endingPrice = "");
    }

    if (reviewFilter) {
      formattedReviewResult =
        reviewFilter.includes("-") && reviewFilter.split("-");
      ratingValue = parseInt(formattedReviewResult[0].trim());
      console.log("rating value =>", typeof ratingValue);
    } else {
      ratingValue = 0;
    }
    if (discountFilter) {
      formattedDiscountResult =
        discountFilter.includes("-") && discountFilter.split("-");
      discountValue = parseInt(formattedDiscountResult[0].trim());
      console.log("discount value =>", typeof discountValue);
    } else {
      discountValue = 0;
    }

    await sql.connect(configuration);
    const response = await sql.query(
      `exec spGetBusinessServicesCustomerFilter '${startingPrice}', '${endingPrice}', '${ratingValue}',  '${businessID}', '${discountValue}' `
    );
    console.log("response for filtered business services", response);
    if (response.recordset.length > 0) {
      res.status(200).send(response);
    } else {
      res.send({ message: "Data is Not Available" });
    }
  } catch (e) {
    res.status(500).send({ message: "Internal Server Error" });
    console.log(
      "Error occur while fetching business service by customer filter",
      e
    );
  }
};

//apply discounts on business service by business
const applyDiscountOnBusinessServices = async (req, res) => {
  try {
    debugger;
    console.log("req body for apply discount", req.body);
    const { serviceID, serviceName, businessID, endDate, startDate, discount } =
      req.body;
    await sql.connect(configuration);
    const response = await sql.query(
      `exec spApplyDiscountOnBusinessService '${serviceID}', '${serviceName}','${businessID}','${startDate}','${endDate}','${discount}'`
    );
    // console.log("response for appointment list", response);
    if (response.recordset[0][""] == "1") {
      res.status(200).send({ message: "discount saved successfully" });
      return;
    } else if (response.recordset[0][""] == "2") {
      res.status(200).send({ message: "select today's or future date" });
      return;
    } else if (response.recordset[0][""] == "3") {
      res
        .status(200)
        .send({ message: "data already exist, your record is updted" });
      return;
    } else {
      res.status(404).send({ message: "discount not saved" });
      return;
    }
  } catch (e) {
    res.status(404).send("Data Not Found");
    console.log("Error occur while insert discount in business service");
  } finally {
    await sql.close();
  }
};

//get static data of filter price, filter review & filter discount display to customer that customer can filter business services.
const getStaticFilterDataForCustomer = async (req, res) => {
  try {
    await sql.connect(configuration);
    const result = await sql.query(`exec spGetFilterDataForCustomer`);
    if (result.recordsets.length > 0) {
      res.status(200).send(result);
    } else {
      res.send({ message: "filter data not found" });
    }
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};
//get static data of filter price, filter review & filter discount display to customer that customer can filter business services.
const getDiscountListForBusiness = async (req, res) => {
  try {
    const { businessID } = req.body;
    console.log("discount list", businessID);
    await sql.connect(configuration);
    const result = await sql.query(
      `exec spGetDiscountListForBusiness '${businessID}'`
    );
    if (result.recordset.length > 0) {
      res.status(200).send(result);
    } else {
      res.send({ message: "discount list not found" });
    }
    // console.log("result", result);
  } catch (e) {
    console.log("error", e);
    res.status(404).send("Data Not Found");
  } finally {
    await sql.close();
  }
};
module.exports = {
  getAllData,
  getDataByName,
  customerRegistration,
  getBusinessCategories,
  businessRegistrationAndPersonalInformation,
  customerAndBusinessLogin,
  forgotAccountPassword,
  getBusinessData,
  getCustomerData,
  disableOrEnableBusinessOrCustomerServices,
  multipleDisableOrEnableRecords,
  AddBusinessServicesBusDash,
  getBusinessServices,
  deleteSelectedBusDashBusService,
  multipleDeleteRecordsBusDashBusService,
  updatedRecordOnselectedBusiessServiceRow,
  getCountryList,
  getStateListByCountry,
  getCityListByState,
  getBusinessListByLocation,
  bookAppointment,
  getBookedSlotList,
  updateNotificationBadgeOnModalClose,
  getCustomerAppointmentList,
  getSlotListForBusiness,
  handleAcceptOrDeclineSlot,
  onlinePaymentFromCustomer,
  getPaymentList,
  changePaymentStatusOfCustomerOnCashMode,
  getPaymentListForBusiness,
  cashPaymentCollectedByBusiness,
  takeFeedbackFromCustomer,
  getFeedbackListForBusiness,
  businessResponseForCustomerFeedback,
  getFeedbackListForCustomer,
  getCustomerDataByIDForEditProfile,
  updateCustomerProfileData,
  getBusinessDataAndPersonalInfoForEditProfile,
  updateBusinessProfile,
  getBusinessServicesByCustomerFilter,
  applyDiscountOnBusinessServices,
  getStaticFilterDataForCustomer,
  getDiscountListForBusiness,
};
