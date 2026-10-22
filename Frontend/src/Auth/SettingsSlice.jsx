import { createSlice } from "@reduxjs/toolkit";

export const settingsInitialState = {
  theme: "light",
  units: "Imperial",
  goals: "Maintain",
  shame: "Off",
  equipment: [],
  gender: "",
  pronouns: "",
  dateOfBirth: "",
  locations: [],
  tutorialComplete: false,
  timezone: "EST",
  // user's profile bio (displayed on Profile page)
  user_bio: "",
  // backend keys
  _id: "",
  availableEquipment: "",
  created_at: "",
  homeGymId: "",
  notifications: "",
  shameLevel: "",
  updated_at: "",
  user_id: "",
};

export const SettingSlice = createSlice({
    name: "setting",
    initialState: settingsInitialState,  // reference it here
    reducers: {
    updateSetting: (state, action) => {
        const { key, value } = action.payload;
        state[key] = value;
    },
    setSettings: (state, action) => {
        return { ...state, ...action.payload };
    },
    }
});

export const { updateSetting, setSettings, settingsLogout } = SettingSlice.actions;
export default SettingSlice.reducer;
