const fs = require('fs');
const path = require('path');
const {v4: uuid} = require('uuid');


const dirCodes = path.join( __dirname,'codes');

// creating folder for input codes

if( !fs.existsSync(dirCodes)) {

fs.mkdirSync(dirCodes, {recursive :true});    
}

const generateFile = async (format, content) => {

    const jobId = uuid();
    const filename = `${jobId}.${format}` ;
    const filePath = path.join(dirCodes, filename);
      await fs.writeFileSync(filePath,content);
    return filePath;
} 
module.exports ={
    generateFile,
}