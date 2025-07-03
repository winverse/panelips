import { RecipeConfig } from '@pandacss/types';
import { buttonRecipe } from '@src/styles/recipes/button';
import { inputRecipe } from '@src/styles/recipes/input';

export const recipes: Record<string, Partial<RecipeConfig>> = {
  button: buttonRecipe,
  input: inputRecipe,
};
