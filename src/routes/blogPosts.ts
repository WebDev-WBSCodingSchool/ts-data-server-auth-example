import { Router } from 'express';
import {
  createBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost
} from '#controllers';
import { authenticate, validateBodyZod } from '#middlewares';
import { blogPostInputSchema } from '#schemas';

const blogPostRouter = Router();

blogPostRouter
  .route('/')
  .get(authenticate, getAllBlogPosts)
  .post(validateBodyZod(blogPostInputSchema), createBlogPost);
blogPostRouter
  .route('/:id')
  .get(getBlogPostById)
  .put(validateBodyZod(blogPostInputSchema), updateBlogPost)
  .delete(deleteBlogPost);

export default blogPostRouter;
