import express from 'express';
import cors from 'cors';
import '#db';
import { blogPostRouter } from '#routes';
import { auth } from '#services';
import { errorHandler, notFoundHandler } from '#middlewares';

const app = express();
const port = process.env.PORT || '3000';

app.use(express.json());

app.use(
  cors({
    credentials: true,
    origin: '*'
  })
);

app.use('/auth', auth);

app.use('/blog', blogPostRouter);

app.use('*splat', notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
