import { Request, Response } from "express"
import Collection from "../database/models/collectionModel.js"

class CollectionController{
    collectionData = [
        {
            collectionName : "Man"
        }, 
        {
            collectionName : "Women"
        },
        {
            collectionName : "All"
        }

    ]
    async seedCollection():Promise<void>{

            const datas = await Collection.findAll()
            if(datas.length === 0){
                await Collection.bulkCreate(this.collectionData)
                console.log("Collection seeded successfully")
            }else{
                console.log("Collection already seeded")
            }

      
    }
    async addCollection(req:Request,res:Response):Promise<void>{
        //@ts-ignore
       
        const {collectionName} = req.body 
        if(!collectionName){
            res.status(400).json({
                message : "Please provide collectionName"
            })
            return 
        }
        const data = await Collection.findAll({
            where : {
                collectionName : collectionName
            }
        })
        if(data.length > 0){
            res.status(400).json({
                message : "Collection already exists"
            })
            return 
        }
        const collection = await Collection.create({
            collectionName
        })
        res.status(201).json({
            message : "Collection created successfully ", 
            data : Collection
        })
    }
    async getCollection(req:Request,res:Response):Promise<void>{
        const data = await Collection.findAll()
        res.status(200).json({
            message : "fetched collections", 
            data
        })
    }
    async deleteCollection(req:Request,res:Response):Promise<void>{
        const {id} = req.params 
        if(!id){
            res.status(400).json({
                message : "Please provide id to delete"
            })
            return 
        }
        const data = await Collection.findAll({
            where : {
                id : id
            }
        }) // array return 
        // const data = await Collection.findByPk(id) // object return 
        if(data.length === 0){
            res.status(404).json({
                message : "No collection with that id"
            })
        }else{
            await Collection.destroy({
                where : {
                    id 
                }
            })
            res.status(201).json({
                message : "Collection deleted successfully"
            })
        }
    }
    async updateCollection(req:Request,res:Response):Promise<void>{
        const {id} = req.params
        const {collectionName} = req.body 
        if(!id || !collectionName){
            res.status(400).json({
                message : "Please provide id, collectionName to update"
            })
            return 
        }
        const data = await Collection.findAll({
            where : {
                id : id
            }
        }) // array return 
        // const data = await Collection.findByPk(id) // object return 
        if(data.length === 0){
            res.status(404).json({
                message : "No collection with that id"
            })
        }else{
            await Collection.update({
                collectionName : collectionName
            },{
                where : {
                    id
                }
            })
            res.status(201).json({
                message : "Collection updated successfully"
            })
        }
    }
}
export default new CollectionController