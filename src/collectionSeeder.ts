import Collection from "./database/models/collectionModel.js";

const collectionSeeder = async () => {
    const collectionData = [
        {
            collectionName: "Man"
        },
        {
            collectionName: "Women"
        },
        {
            collectionName: "All"
        }
    ];

    try {
        const existingCollections = await Collection.findAll();
        
        if (existingCollections.length === 0) {
            await Collection.bulkCreate(collectionData);
            console.log("Collections seeded successfully: Man, Women, All");
        } else {
            console.log("Collections already seeded");
        }
    } catch (error) {
        console.error("Error seeding collections:", error);
    }
};

export default collectionSeeder;
