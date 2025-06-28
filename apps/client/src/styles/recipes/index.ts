import type { RecipeConfig } from '@pandacss/types/dist/recipe';
import { buttonRecipe } from '@src/styles/recipes/button';

export const recipes: Record<string, Partial<RecipeConfig>> = {
  button: buttonRecipe,
};
