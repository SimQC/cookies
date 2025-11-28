/*
  # Set simon@simonlacroix.net as Admin

  1. Updates
    - Set role = 'admin' for user with email simon@simonlacroix.net
    - Uses a function to safely update the role only if the user exists

  2. Notes
    - This migration will only update the role if a user with this email exists
    - If the user doesn't exist yet, they will need to register first
    - The admin role will be set automatically when they register if this email is used
*/

-- Function to set user as admin by email
CREATE OR REPLACE FUNCTION set_user_as_admin(user_email text)
RETURNS void AS $$
BEGIN
  -- Update profiles table
  UPDATE profiles
  SET role = 'admin'
  WHERE email = user_email;
  
  -- If no profile exists yet, the trigger will create one when user registers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set simon@simonlacroix.net as admin
SELECT set_user_as_admin('simon@simonlacroix.net');

-- Update the trigger to automatically set admin role for this email on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email,
    CASE 
      WHEN new.email = 'simon@simonlacroix.net' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;