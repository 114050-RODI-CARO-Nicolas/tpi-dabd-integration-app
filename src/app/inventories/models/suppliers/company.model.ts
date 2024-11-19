export interface Company {
    id: number;
    name: string;
    registration: string;
    enabled: boolean;
}

export interface CompanyRequest {
    name: string;
}