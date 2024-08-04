import {Test} from '@nestjs/testing'
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';


import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PatientModule } from '../src/patient/patient.module';
import { DoctorModule } from '../src/doctor/doctor.module';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HospitalModule } from '../src/hospital/hospital.module';
import { CreateAppointmentDto, CreatePrescriptionDto, DoctorSignupDto } from '../src/dto';
import { PrismaModule } from '../src/prisma/prisma.module';

describe('App e2e', ()=>{

  const url = 'http://localhost:3030/api/v1'
  // const url = 'http://localhost:8080/api/v1'

  let app: INestApplication;

  let prisma: PrismaService;

    beforeAll(async ()=> {

      const moduleRef = await Test.createTestingModule({
        imports: [AppModule, AuthModule, PatientModule, DoctorModule, HospitalModule],
      }).compile();

      app = moduleRef.createNestApplication();

      app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
      await app.init();

      await app.listen(3070);

      prisma = app.get(PrismaService);
      pactum.request.setBaseUrl(url);
    });

  afterAll(()=> app.close());

  describe('Auth', ()=>{

    const patientSignupDto = {
        name: "Yashavant",
        aadharNumber: "12345678901",
        contactNumber: "8073889510",
        gender: "MALE",
        email: "yashwant44@gmail.com",
        dob: new Date("2003-02-22"),
        password: "test@123",
        address: "123 Main St, City, Country"
    }

    const patientSigninDto = {
      email: "yashwant44@gmail.com",
      password:"test@123"
    }

    const hospitaSignupDto = {
      name: "BMS Hospital",
      contactNumber: "8045088888",
      email:"bms@email.com",
      password:"bms@email.com",
      address:"No 618, Sri Mallikarjuna Swamy, Gangamma Temple St, NR Colony, Bengaluru, Karnataka 560019",
      location: ["12.9411334","12.9411334"],
      latitude:12.9411334,
      longitude:77.5649215
    }

    const hospitaSigninDto = { 
      email: "bms@email.com",
      password: "bms@email.com"
    }


    const doctorSigninDto = {
      email: "johndoe@example.com",
      password: "strongpassword"
    }

    describe('Patient Signup',()=>{
      it('Should SignUp',()=>{
        return pactum.spec().post('/auth/patient/signup').withBody(patientSignupDto).expectStatus(HttpStatus.CREATED).stores('patientId','id');
      });
    });

    describe('Patient Signin',()=>{
      it('Should SignIn',()=>{
        return pactum.spec().post('/auth/patient/signin').withBody(patientSigninDto).expectStatus(HttpStatus.OK).stores('patientAT','access_token').inspect();
      });
    });

    describe('Hospital Signup',()=>{
      it('Should SignUp',()=>{
        return pactum.spec().post('/auth/hospital/signup').withBody(hospitaSignupDto).expectStatus(HttpStatus.CREATED).stores('hospitlId','id');
      });
    });

    describe('Hospital Signin',()=>{
      it('Should SignIn',()=>{
        return pactum.spec().post('/auth/hospital/signin').withBody(hospitaSigninDto).expectStatus(HttpStatus.OK).stores('hospitalAT','access_token');
      });
    });
    
    describe('Doctor Signup',()=>{
      it('Should Signup',()=>{
        const doctorSignupDto = {
          name: "John Doe",
          email: "johndoe@example.com",
          password: "strongpassword",
          contactNumber: "1234567890",
          specialization: "Cardiology",
          address: "123 Main St, City, Country",
          gender: "MALE",
          dob: new Date("1990-05-20"),
          avatar: "https://example.com/avatar.jpg",
          consultingFees: 500,
          affiliatedHospitalId: '$S{hospitlId}'
        }
        return pactum.spec().post('/auth/doctor/signup').withBody(doctorSignupDto).expectStatus(HttpStatus.CREATED).stores('doctorId','id').inspect();
      });
    });

    describe('Doctor Signin',()=>{
      it('Should SignIn',()=>{
        return pactum.spec().post('/auth/doctor/signin').withBody(doctorSigninDto).expectStatus(HttpStatus.OK).stores('doctorAT','access_token');
      });
    });

  });


  describe('Patient', ()=>{

    describe('Get All Prescriptions',()=>{
      it('Got Prescriptions',()=>{
        return pactum.spec().get('/patient/get-prescriptions')
        .withHeaders({
          Authorization: 'Bearer $S{patientAT}'
        })
        .expectStatus(HttpStatus.OK);
      });
    });

    describe('Book Normal appointment',()=>{
      it('Booked Appointment',()=>{

        const appointmentDto = {
          doctorId: 'ff13c059-831c-49e4-8cee-597016c54db7',
          reason: "Viral Fever"
        }

        return pactum.spec().post('/patient/book-appointment')
        .withHeaders({
          Authorization: 'Bearer $S{patientAT}'
        })
        .expectStatus(HttpStatus.CREATED);
      });
    });

    describe('Book emergency appointment',()=>{
      it('Booked Appointment',()=>{

        const appointmentDto = {
          doctorId:'ff13c059-831c-49e4-8cee-597016c54db7',
          reason:"Viral Fever"
        }

        return pactum.spec().post('/patient/book-emergency-appointment')
        .withHeaders({
          Authorization: 'Bearer $S{patientAT}'
        })
        .expectStatus(HttpStatus.CREATED);
      });
    }); 

    describe('Get Appointments',()=>{
      it('Got Appointments',()=>{
        return pactum.spec().get('/patient/get-appointments')
        .withHeaders({
          Authorization: 'Bearer $S{patientAT}'
        })
        .expectStatus(HttpStatus.OK);
      })
    });

    describe('Review Appointment',()=>{
      it('Reviewed Appointment',()=>{

        const appointmentDto = {
          doctorId:'$S{doctorId}',
          reason:"Viral Fever"
        }

        return pactum.spec().post('/patient/appointment-review')
        .withHeaders({
          Authorization: 'Bearer $S{patientAT}'
        })
        .withBody({appointmentDto, rating:4})
        .expectStatus(HttpStatus.OK);
      });
    });

    describe('Inactive Prescriptions',()=>{
      it('Got Inactive Prescriptions',()=>{
        return pactum.spec().get('/patient/inactive-prescriptions')
        .withHeaders({
          Authorization: 'Bearer $S{patientAT}'
        })
        .expectStatus(HttpStatus.OK);
      });
    });

    // describe('Delete Prescription',()=>{
    //   it('Deleted Prescription',()=>{
    //     return pactum.spec().delete('/patient/inactive-prescription/$S{prescriptionId}')
    //     .withHeaders({
    //       Authorization: 'Bearer $S{patientAT}'
    //     })
    //     .expectStatus(HttpStatus.NO_CONTENT);
    //   });
    // });

  });

  describe('Doctor', ()=>{

    describe('Get All Appointments',()=>{
      it('Got Appointments',()=>{
        return pactum.spec().get('/doctor/get-appointments')
        .withHeaders({
          Authorization: 'Bearer $S{doctorAT}'
        })
        .expectStatus(HttpStatus.OK);
      });
    });

    describe('View Prescription By Id',()=>{
      it('Viewed Prescription',()=>{
        return pactum.spec().get('/doctor/get-prescriptions/$S{patientId}')
        .withHeaders({
          Authorization: 'Bearer ${doctorAT}'
        })
        .expectStatus(HttpStatus.OK);
      });
    });
    
    describe('Add Prescription',()=>{
      it('Added Prescription',()=>{

        const prescriptionDto = {
          patientId: "$S{patientId}",
          instructionForOtherDoctor: "Patient is bit allergic to penicillin",
          medication: [
            {
              name: "Crocin",
              dosage: "250 mg",
              duration: 5,
              instruction : "1-0-1 after meal"
            },{
              name: "Paracetamol",
              dosage: "500 mg",
              duration: 5,
              instruction : "1-1-1 after meal"
            }
          ]
        }

        return pactum.spec().post('/doctor/addPrecriptions/$S{patientId}')
        .withHeaders({
          Authorization: 'Bearer $S{doctorAT}'
        })
        .withBody(prescriptionDto)
        .expectStatus(HttpStatus.OK)
        .stores('prescriptionId','id');
      });
    });

    describe('Add 2 Prescription',()=>{
      it('Added  2 Prescription',()=>{

        const prescriptionDto = {
          patientId: "$S{patientId}",
          instructionForOtherDoctor: "Patient is bit allergic to pollen",
          medication: [
            {
              name: "Azithromycin",
              dosage: "250 mg",
              duration: 5,
              instruction : "1-0-1 after meal"
            },{
              name: "Saridon",
              dosage: "500 mg",
              duration: 5,
              instruction : "1-1-1 after meal"
            }
          ]
        }

        return pactum.spec().post('/doctor/addPrecriptions/$S{patientId}')
        .withHeaders({
          Authorization: 'Bearer $S{doctorAT}'
        })
        .withBody(prescriptionDto)
        .expectStatus(HttpStatus.OK);
      });
    });
    
    describe('Delete Prescription Request',()=>{
      it('Deleted Prescription Request',()=>{
        return pactum.spec().post('/doctor/delete-prescription-request/$S{prescriptionId}')
        .withHeaders({
          Authorization: 'Bearer $S{doctorAT}'
        })
        .withBody({patientId: "$S{patientId}"})
        .expectStatus(HttpStatus.NO_CONTENT);
      });
    });

  });


  describe('Common Module', ()=>{

    describe('Get Details Of Platform',()=>{
      it('Got Details',()=>{
        return pactum.spec().get('/common-module')
        .withHeaders({Authorization: 'Bearer $S{patientAT'})
        .expectStatus(HttpStatus.OK);
      });
    });

    describe('Get Doctors',()=>{
      it('Got Doctors',()=>{
        return pactum.spec().get('/common-module/get-doctors')
        .withHeaders({Authorization: 'Bearer $S{patientAT'})
        .expectStatus(HttpStatus.OK);
      });
    });

    describe('Get Hospitals',()=>{
      it('Got Hospitals',()=>{
        return pactum.spec().get('/common-module/get-hospitals')
        .withHeaders({Authorization: 'Bearer $S{patientAT'})
        .expectStatus(HttpStatus.OK);
      });
    });

    describe('Get Doctor By Id',()=>{
      it('Got Doctor',()=>{
        return pactum.spec().get('/common-module/get-doctor/$S{doctorId}')
        .withHeaders({Authorization: 'Bearer $S{patientAT'})
        .expectStatus(HttpStatus.OK);
      });
    });

    describe('Get Hospital By Id',()=>{
      it('Got Hospital',()=>{
        return pactum.spec().get('/common-module/get-hospital/$S{hospitlId}')
        .withHeaders({Authorization: 'Bearer $S{patientAT'})
        .expectStatus(HttpStatus.OK);
      });
    });

  });

});