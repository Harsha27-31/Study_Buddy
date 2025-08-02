const mongoose = require('mongoose');
const List = require('../MODELS/List');
const jsonData = require('./study_buddy.json');

mongoose.connect('mongodb+srv://harsha2731vardhan:v9Sbzj9EgaU0KKI4@cluster0.vruaq9m.mongodb.net/Study_Buddy?retryWrites=true&w=majority')
.then(async () => {
  console.log('✅ MongoDB connected...');
  
  await List.deleteMany({});
  console.log('🧹 Existing data cleared');

  await List.insertMany(jsonData);
  console.log('✅ Data inserted into MongoDB');

  process.exit(0);
})
.catch((err) => {
  console.error('❌ An issue occurred while connecting to MongoDB:', err);
  process.exit(1);
});