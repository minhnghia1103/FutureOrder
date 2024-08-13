import express, { urlencoded } from 'express';
import connection from './config/config';
import PersonalRoute  from './routes/personalInfor';
import todoRoute from './routes/todo.route';
import {json} from 'express';


const app = express();

app.use(json());

app.use(urlencoded({ extended: false }));



app.use((
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction

)=>{
    res.status(500).json({message: err.message});
});


app.use('/todo', todoRoute);

connection.sync().then(() => {
    console.log("Database connected and synced");
}).catch((err) => {
    console.log("Error connecting to database", err);
})

app.listen(3000, () => {});