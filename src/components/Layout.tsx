import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getDoctorPatients, getDoctor } from "@/services/doctorService";
import {
  Heart,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Calendar,
} from "lucide-react";
import PatientDashboard from "./PatientDashboard";
import DoctorDashboard from "./DoctorDashboard";
import PatientProfile from "./PatientProfile";
import SettingsPanel from "./SettingsPanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/firebase";
import {
  getPatient,
  getPatientConsultations,
  getPatientMedications,
  getPatientMedicalImages,
} from "@/services/patientService";
import { DcmViewer } from "@/components/DcmViewer";
type UserType = "patient" | "doctor";
type ActiveSection = "dashboard" | "history" | "settings";

interface LayoutProps {
  userType: UserType;
  onLogout: () => void;
}

const Layout = ({ userType, onLogout }: LayoutProps) => {
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [viewingPatientProfile, setViewingPatientProfile] = useState(false);
  const [doctorPatients, setDoctorPatients] = useState<any[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(
    null
  );
  const [selectedXrayImage, setSelectedXrayImage] = useState<string | null>(
    null
  );
  const [consultations, setConsultations] = useState<any[]>([]);
  const [consultationMedications, setConsultationMedications] = useState<any[]>(
    []
  );
  const [loadingConsultationDialog, setLoadingConsultationDialog] =
    useState(false);
  const [consultationMedicalImages, setConsultationMedicalImages] = useState<
    any[]
  >([]);
  const [userInfo, setUserInfo] = useState<{ fullName: string } | null>(null);

  const patientNavItems = [
    {
      id: "dashboard" as const,
      label: "Panou principal",
      icon: LayoutDashboard,
    },
    { id: "history" as const, label: "Istoric medical", icon: FileText },
    { id: "settings" as const, label: "Setări", icon: Settings },
  ];

  const doctorNavItems = [
    {
      id: "dashboard" as const,
      label: "Panou principal",
      icon: LayoutDashboard,
    },
    { id: "history" as const, label: "Pacienți recenți", icon: FileText },
    { id: "settings" as const, label: "Setări", icon: Settings },
  ];

  const navItems = userType === "patient" ? patientNavItems : doctorNavItems;

  useEffect(() => {
    if (userType === "patient") {
      const fetchConsultations = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const data = await getPatientConsultations(userId);
        setConsultations(data);
      };

      fetchConsultations();
    }
  }, [userType]);

  useEffect(() => {
    if (userType === "doctor") {
      const fetchDoctorPatients = async () => {
        const doctorId = auth.currentUser?.uid;
        if (!doctorId) return;

        const patients = await getDoctorPatients(doctorId);
        setDoctorPatients(patients);
      };

      fetchDoctorPatients();
    }
  }, [userType]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      if (userType === "patient") {
        const patient = await getPatient(userId);
        if (patient) {
          setUserInfo({ fullName: patient.fullName });
        }
      } else {
        const doctor = await getDoctor(userId);
        if (doctor) {
          setUserInfo({ fullName: `Dr. ${doctor.fullName}` });
        }
      }
    };

    fetchUserInfo();
  }, [userType]);

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
  const handleOpenPatientProfile = (patient: any) => {
    const transformedPatient = {
      cnp: patient.cnp,
      name: patient.fullName,
      age: calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      lastVisit: new Date().toISOString().split("T")[0],
      conditions: patient.allergies,
    };
    setSelectedPatient(transformedPatient);
    setViewingPatientProfile(true);
  };

  const handleBackFromProfile = () => {
    setViewingPatientProfile(false);
    setSelectedPatient(null);
  };

  const renderContent = () => {
    if (activeSection === "dashboard") {
      return userType === "patient" ? (
        <PatientDashboard />
      ) : (
        <DoctorDashboard />
      );
    }

    if (activeSection === "history" && userType === "doctor") {
      if (viewingPatientProfile && selectedPatient) {
        return (
          <PatientProfile
            patient={selectedPatient}
            onBack={handleBackFromProfile}
          />
        );
      }

      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-medical text-foreground">
              Pacienți recenți
            </h1>
            <p className="text-muted-foreground mt-1">
              Pacienți consultați recent
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Consultații recente
              </CardTitle>
              <CardDescription>
                Pacienți cu consultații medicale recente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {doctorPatients.length > 0 ? (
                <div className="space-y-3">
                  {doctorPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-4 border border-border rounded-medical hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleOpenPatientProfile(patient)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-lg">
                            {patient.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            CNP: {patient.cnp}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {patient.gender} • {patient.bloodType}
                          </p>
                          {patient.allergies &&
                            patient.allergies.length > 0 && (
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
                  Niciun pacient momentan
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSection === "history" && userType === "patient") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-medical text-foreground">
              Istoric medical
            </h1>
            <p className="text-muted-foreground mt-1">
              Istoricul consultațiilor și tratamentelor tale
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Consultații recente
              </CardTitle>
              <CardDescription>
                Consultațiile și tratamentele tale recente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {consultations.length > 0 ? (
                  consultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="p-4 border border-border rounded-medical hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={async () => {
                        setLoadingConsultationDialog(true);
                        setSelectedConsultation(consultation);
                        const userId = auth.currentUser?.uid;
                        if (userId) {
                          const meds = await getPatientMedications(userId);
                          const consultMeds = meds.filter(
                            (m) => m.consultationId === consultation.id
                          );
                          setConsultationMedications(consultMeds);
                          const medImgs = await getPatientMedicalImages(userId);
                          const consultMedImgs = medImgs.filter(
                            (img: any) => img.consultationId === consultation.id
                          );
                          setConsultationMedicalImages(consultMedImgs);
                        }
                        setLoadingConsultationDialog(false);
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-primary">
                            {consultation.diagnosis}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dr. {consultation.doctorName}
                          </p>
                        </div>
                        <Badge variant="outline">{consultation.date}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Note:</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {consultation.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nu există înregistrări de consultații
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSection === "settings") {
      return <SettingsPanel />;
    }

    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-muted-foreground mb-2">
          {navItems.find((item) => item.id === activeSection)?.label}
        </h2>
        <p className="text-muted-foreground">
          Această secțiune va fi disponibilă în curând...
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-clinical">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold font-medical text-lg">MedConnect</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 lg:relative lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <div className="flex h-full flex-col">
            <div className="hidden lg:flex h-16 items-center gap-2 px-6 border-b border-border">
              <Heart className="h-8 w-8 text-primary" />
              <span className="font-bold font-medical text-xl">MedConnect</span>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-medical rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {userType === "patient" ? "P" : "D"}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{userInfo?.fullName}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {userType}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveSection(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-medical text-left transition-colors
                          ${
                            isActive
                              ? "bg-gradient-medical text-white shadow-medical"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }
                        `}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={onLogout}
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                Deconectare
              </Button>
            </div>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-6 lg:p-8">{renderContent()}</div>
        </main>
      </div>
      <Dialog
        open={selectedConsultation !== null}
        onOpenChange={(open) => !open && setSelectedConsultation(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {loadingConsultationDialog ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Se încarcă...</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{selectedConsultation?.diagnosis}</DialogTitle>
                <DialogDescription>
                  Dr. {selectedConsultation?.doctorName} •{" "}
                  {selectedConsultation?.date}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Note ale consultației</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedConsultation?.notes}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Prescripție</h4>
                  {consultationMedications.length > 0 ? (
                    <div className="space-y-2">
                      {consultationMedications.map((med, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-medical">
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dose} - {med.frequency} - {med.duration} zile
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nicio prescripție
                    </p>
                  )}
                </div>

                {selectedConsultation?.imageUrls &&
                  selectedConsultation.imageUrls.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Imagini medicale</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedConsultation.imageUrls.map(
                            (imageUrl: string, idx: number) => (
                              <img
                                key={idx}
                                src={imageUrl}
                                alt={`Imagine medicală ${idx + 1}`}
                                className="w-full rounded-medical border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setSelectedXrayImage(imageUrl)}
                              />
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                {consultationMedicalImages.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Radiografii DICOM</h4>
                      <div className="space-y-3">
                        {consultationMedicalImages.map((img, idx) => (
                          <div key={idx} className="p-3 border rounded-medical">
                            <div className="space-y-2">
                              <p className="font-medium">{img.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {img.notes}
                              </p>
                              <div className="border rounded p-2 bg-black">
                                <DcmViewer
                                  imageUrl={img.imageUrl.replace(
                                    "https://firebasestorage.googleapis.com",
                                    "/storage-proxy"
                                  )}
                                  className="w-full h-48"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* X-ray Image Popup */}
      <Dialog
        open={selectedXrayImage !== null}
        onOpenChange={(open) => !open && setSelectedXrayImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Imagine radiografică medicală</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedXrayImage || ""}
              alt="Imagine radiografică mărită"
              className="w-full h-auto rounded-medical"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
