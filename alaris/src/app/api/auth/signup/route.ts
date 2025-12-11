import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { signupSchema, calculateAge } from '@/lib/utils/validation';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validatedData = signupSchema.parse({
      ...body,
      confirm_password: body.password, // API doesn't need confirm, just validate password
    });
    
    // Additional server-side age check
    const age = calculateAge(validatedData.date_of_birth);
    if (age < 13) {
      return NextResponse.json(
        { error: 'You must be at least 13 years old to use Alaris.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', validatedData.email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email.toLowerCase(),
      password: validatedData.password,
      email_confirm: true, // Auto-confirm for now (can add email verification later)
      user_metadata: {
        full_name: validatedData.full_name,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Handle specific auth errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Create user profile in public.users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        full_name: validatedData.full_name,
        email: validatedData.email.toLowerCase(),
        date_of_birth: validatedData.date_of_birth,
        location: validatedData.location || null,
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Failed to create profile. Please try again.' },
        { status: 500 }
      );
    }

    // Note: The memory record is auto-created by the database trigger

    // Sign in the user to create a session
    // We need to do this from the client side after redirect
    // For now, just return success

    return NextResponse.json(
      { 
        success: true,
        message: 'Account created successfully',
        user_id: authData.user.id,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

