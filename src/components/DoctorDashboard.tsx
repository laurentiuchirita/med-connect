import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PatientProfile from "./PatientProfile";
import { Search, User } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  getDoctorPatients,
  searchPatientByCNP,
  getAllPatients,
} from "@/services/doctorService";
import { Patient } from "@/models/patient";
import { useToast } from "@/hooks/use-toast";

const DoctorDashboard = () => {
  const [searchCNP, setSearchCNP] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewingProfile, setViewingProfile] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const fetchPatients = async () => {
      const allPatients = await getAllPatients();
      setPatients(allPatients);
      setLoading(false);
    };

    fetchPatients();
  }, []);

  const handleSearch = async () => {
    if (!searchCNP.trim()) {
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "e rugăm să introduci un CNP pentru a căuta",
      });
      return;
    }

    setLoading(true);
    const patient = await searchPatientByCNP(searchCNP);

    if (patient) {
      setSelectedPatient(patient);
      setViewingProfile(true);
    } else {
      toast({
        variant: "destructive",
        title: "Nu a fost găsit",
        description: "Nu a fost găsit niciun pacient cu acest CNP",
      });
    }
    setLoading(false);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewingProfile(true);
  };

  const handleBackToSearch = () => {
    setViewingProfile(false);
    setSelectedPatient(null);
  };

  if (viewingProfile && selectedPatient) {
    const transformedPatient = {
      cnp: selectedPatient.cnp,
      name: selectedPatient.fullName,
      age: calculateAge(selectedPatient.dateOfBirth),
      gender: selectedPatient.gender,
      lastVisit: new Date().toISOString().split("T")[0],
      conditions: selectedPatient.allergies,
    };
    return (
      <PatientProfile
        patient={transformedPatient}
        onBack={handleBackToSearch}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-medical text-primary">
          Se încarcă pacienții...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-medical text-foreground">
          Panoul medicului
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestionează consultațiile și fișele medicale ale pacienților
        </p>
      </div>

      {/* Patient Search */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Căutare pacient
          </CardTitle>
          <CardDescription>
            Caută pacienți folosind CNP-ul (Cod Numeric Personal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Introdu CNP-ul pacientului (ex: 2950715123456)"
                value={searchCNP}
                onChange={(e) => setSearchCNP(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="font-medical"
                disabled={loading}
              />
            </div>
            <Button onClick={handleSearch} variant="medical" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Caută
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Pacienții tăi
          </CardTitle>
          <CardDescription>Pacienții pe care i-ai consultat</CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3 border border-border rounded-medical hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{patient.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        CNP: {patient.cnp}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {patient.gender} • {patient.bloodType}
                      </p>
                      {patient.allergies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {patient.allergies.map((allergy, idx) => (
                            <Badge
                              key={idx}
                              variant="destructive"
                              className="text-xs"
                            >
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nu există pacienți încă
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
