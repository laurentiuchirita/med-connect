import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  User,
  Heart,
  Shield,
  Pill,
  ImageIcon,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  getPatient,
  getPatientMedications,
  getPatientVaccinations,
  getPatientConsultations,
  getPatientLabResults,
  getPatientMedicalImages,
} from "@/services/patientService";
import { Patient } from "@/models/patient";
import { Medication } from "@/models/medication";
import { Vaccination } from "@/models/vaccination";
import { Consultation } from "@/models/consultation";
import { LabResult } from "@/models/labResult";
import { MedicalImage } from "@/models/medicalImage";
import { exportPatientMedicalRecord } from "@/services/pdfService";
import { DcmViewer } from "@/components/DcmViewer";

const PatientDashboard = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [medicalImages, setMedicalImages] = useState<MedicalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      const [patientData, meds, vacs, consults, labs, images] =
        await Promise.all([
          getPatient(userId),
          getPatientMedications(userId),
          getPatientVaccinations(userId),
          getPatientConsultations(userId),
          getPatientLabResults(userId),
          getPatientMedicalImages(userId),
        ]);

      setPatient(patientData);
      setMedications(meds);
      setVaccinations(vacs);
      setConsultations(consults);
      setLabResults(labs);
      setMedicalImages(images);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleExportPDF = () => {
    if (!patient) return;

    exportPatientMedicalRecord(
      patient,
      medications,
      vaccinations,
      consultations,
      labResults,
      medicalImages
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-800";
      case "abnormal":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-medical text-primary">
          Se încarcă datele pacientului...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-destructive">
          Error loading patient data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-medical text-foreground">
            Panou de control pacient
          </h1>
          <p className="text-muted-foreground mt-1">
            Prezentare generală a dosarului tău medical
          </p>
        </div>
        <Button onClick={handleExportPDF} variant="medical" className="gap-2">
          <Download className="h-4 w-4" />
          Exportă dosarul medical în PDF
        </Button>
      </div>

      {/* Demographics */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informații personale
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Nume complet
            </p>
            <p className="font-medical">{patient.fullName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">CNP</p>
            <p className="font-medical">{patient.cnp}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Data nașterii
            </p>
            <p className="font-medical">{patient.dateOfBirth}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gen</p>
            <p className="font-medical">{patient.gender}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Grupa sanguină
            </p>
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200"
            >
              {patient.bloodType}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Allergies & Critical Info */}
      <Card className="shadow-card border-l-4 border-l-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Alergii și informații critice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {patient.allergies.length > 0 ? (
              patient.allergies.map((allergy, index) => (
                <Badge key={index} variant="destructive">
                  {allergy}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Fără alergii cunoscute
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Medications */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Medicamente curente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {medications.length > 0 ? (
              medications.map((med) => (
                <div key={med.id} className="p-3 bg-muted rounded-medical">
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {med.dose} - {med.frequency} - {med.duration} days
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Fără medicamente active
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vaccinations */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Istoric vaccinări
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vaccinations.length > 0 ? (
              vaccinations.map((vaccine) => (
                <div
                  key={vaccine.id}
                  className="flex justify-between items-center p-3 bg-muted rounded-medical"
                >
                  <div>
                    <p className="font-medium">{vaccine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {vaccine.date}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700"
                  >
                    {vaccine.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nu există înregistrări de vaccinare
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical History */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Istoric medical și diagnostice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {consultations.length > 0 ? (
            consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="p-3 border border-border rounded-medical"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{consultation.diagnosis}</p>
                    <p className="text-sm text-muted-foreground">
                      Diagnostic pus de Dr. {consultation.doctorName}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {consultation.date}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Nu există consultații înregistrate
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lab Results */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Rezultate recente de laborator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {labResults.length > 0 ? (
              labResults.map((result) => (
                <div
                  key={result.id}
                  className="flex justify-between items-center p-3 border border-border rounded-medical"
                >
                  <div>
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{result.value}</p>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nu există rezultate de laborator
              </p>
            )}
          </CardContent>
        </Card>

        {/* Medical Images */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Imagini medicale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {medicalImages.length > 0 ? (
              medicalImages.map((image) => (
                <div
                  key={image.id}
                  className="p-3 border border-border rounded-medical cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    console.log("Image URL clicked:", image.imageUrl);
                    setSelectedImage(image.imageUrl);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{image.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {image.notes}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {image.date}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nu există imagini medicale
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={selectedImage !== null}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Imagine medicală</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center bg-black p-4 rounded">
              {selectedImage.includes(".dcm") ? (
                <>
                  {console.log("DCM detected:", selectedImage)}
                  <DcmViewer
                    key={selectedImage}
                    imageUrl={selectedImage.replace(
                      "https://firebasestorage.googleapis.com",
                      "/storage-proxy"
                    )}
                    className="w-full h-[600px]"
                  />
                </>
              ) : (
                <img
                  src={selectedImage}
                  alt="Medical image"
                  className="w-full h-auto rounded-medical"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDashboard;
