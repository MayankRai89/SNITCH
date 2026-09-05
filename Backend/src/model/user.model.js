import supabase from "../config/supabaseClient.js";

const SnitchModel = {
  async create(data) {
    const { data: user, error } = await supabase
      .from("users")
      .insert([data])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return user;
  },

  async findByEmail(email) {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned, user not found
        return null;
      }
      throw error;
    }
    return user;
  },

  async findByMobile(mobile) {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("mobile", mobile)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return user;
  },

  async findById(id) {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return user;
  },

  async findByGoogleId(googleId) {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("google_id", googleId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return user;
  },

  async update(id, fields) {
    const { data: user, error } = await supabase
      .from("users")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return user;
  },
};

export default SnitchModel;
