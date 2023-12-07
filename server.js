const express = require("express");
const multer = require('multer');
const app = express();
const path = require('path');

const cors = require("cors");
app.use(express.urlencoded({ extended: true }));



require('dotenv').config({
  override: true,
  path: path.join(__dirname, '.env'),
});

const { Pool , Client} = require('pg');

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});

(async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT current_user');
    const currentUser = rows[0]['current_user'];
    console.log(currentUser);
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    client.release();
  }
})();

const port = 5000;

var corsOptions = {
  origin: "*",
 
};

app.use(cors(corsOptions));

app.use(express.json());


app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ussef application." });
});


const getcode =  async (id)=>{
  const selectQuery = 'SELECT * FROM public."NFC"  where "CODETABLETTE" = $1  ';
  const values = [id]
  const result = await pool.query(selectQuery ,values);
  return result
}


// id SERIAL,
// deviceid INTEGER NOT NULL,
// devicetime TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
// lat DOUBLE PRECISION,
// lon DOUBLE PRECISION,


// app.post('/api/insertData', async (req, res) => {
//   try {
//     const { deviceid, lat , lng  , createddate} = req.body; 

//     const codedata = await getcode(deviceid)
//     const  device =  codedata.rows[0].deviceid
//     console.log( "device id" , device)
      
//     const insertQuery = 'INSERT INTO public.dv (deviceid, devicetime  , lat , lon) VALUES ($1, $2, $3 , $4)';
//     const values = [device, createddate, lat , lng];

//     await pool.query(insertQuery, values);

//     res.status(200).json({ success: true, message: 'Data inserted successfully!' });
//   } catch (err) {
//     console.error('Error executing query:', err);
//     res.status(404).json({ success: false, message: 'Internal server error' });
//   }
// });




const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/ussef/Desktop/readerTag/readertag/src/media/ImageData"); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".png");
  },
});

const upload = multer({ storage: storage });

// app.post('/upload', upload.single('image'), (req, res) => {
//   console.log("File uploaded successfully "  , upload.single('image'));
//   res.json({ message: 'File uploaded successfully' });
// });
// const upload = multer({ dest: "/home/ussef/Desktop/readerTag/readertag/src/media/" });

app.post('/api/tag' ,upload.array('images' ,10) , async (req, res) => {
  try {
    const { numparc, lat , lng  , ntag ,typebac , userid} = req.body; 
    // const imageName = req.file.filename;
    // const codedata = await getcode(deviceid)
    // const  device =  codedata.rows[0].deviceid
    const currentDate = new Date();
    const read_date = currentDate.toISOString().slice(0, 19).replace("T", " ")
    console.log(read_date)
    const imageArray = req.files.map((file) => file.filename);
    const insertQuery = 'INSERT INTO public.tag_reader (numparc , lat  , lng , ntag , typebac ,image  , userid , date_read) VALUES ($1,$2,$3,$4,$5 ,$6 , $7 , $8)';
    const values = [numparc, lat , lng ,ntag , typebac,imageArray ,userid , read_date];

    await pool.query(insertQuery, values);


    res.status(200).json({ success: true, message: 'Data inserted successfully!' });
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(404).json({ success: false, message: 'Internal server error'  , details  : err.detail});
  }
});



app.get('/api/selectData', async (req, res) => {
  try {
    const selectQuery = 'SELECT * FROM public.tag_reader';
    const result = await pool.query(selectQuery);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error executing select query:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
 }
});

app.post('/api/getusers', async (req, res) => {
  try {
     const {username , password} = req.body
    const selectQuery = `select * from   public.tag_user where username = $1 and  password = $2 `;
    const  values = [username , password]
    const result = await pool.query(selectQuery , values);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error executing select query:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
 }
});





app.listen(port, () => {
    console.log(`Server is running in Port :${port}`);
  });
  