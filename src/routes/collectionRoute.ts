import express,{ Router } from "express";
import errorHandler from "../services/errorHandler.js";
import collectionController from "../controllers/collectionController.js";



const router:Router=express.Router()



router.route("/").get(errorHandler(collectionController.getCollection)).post(errorHandler(collectionController.addCollection))

export default router