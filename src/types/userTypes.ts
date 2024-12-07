// types/userTypes.ts
export interface UserData {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    degree: {
        program: string;
        startYear: number;
        anticipatedGraduation: number;
    };
}