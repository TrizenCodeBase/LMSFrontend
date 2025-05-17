import React, { createContext, useContext, useState } from 'react';

interface UserData {
  name: string;
  email: string;
  bio: string;
  avatar: string;
  role: string;
  joinDate: string;
}

interface UserDataContextType {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
}

const defaultUserData: UserData = {
  name: "John Doe",
  email: "john.doe@example.com",
  bio: "Student passionate about web development",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  role: "Student",
  joinDate: "January 2024"
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(defaultUserData);

  const updateUserData = (newData: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  return (
    <UserDataContext.Provider value={{ userData, updateUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};