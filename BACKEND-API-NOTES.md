# Backend fix: Gender and Phone in case detail

Your **GET /api/PatientCase/{id}** (GetById) already returns **PatientPhone** (so mobile number works on the frontend).  
**Gender** is missing from the response. Add it as follows.

## 1. Add property to PatientCaseDetailDto

In your DTO class (e.g. `PatientCaseDetailDto` in `DTOs.PatientCase` or similar), add:

```csharp
public string? PatientGender { get; set; }
```

So the DTO has both:
- `PatientPhone` (you already have this)
- `PatientGender` (add this)

## 2. Set it in GetById (PatientCaseController)

In the `GetById` method, when you build the `PatientCaseDetailDto`, add one line:

```csharp
return Ok(new PatientCaseDetailDto
{
    Id = @case.Id,
    ClinicId = @case.ClinicId,
    PatientId = @case.PatientId,
    PatientFirstName = @case.Patient.FirstName,
    PatientLastName = @case.Patient.LastName,
    PatientDateOfBirth = @case.Patient.DateOfBirth,
    PatientPhone = @case.Patient.Phone,
    PatientGender = @case.Patient.Gender,   // ADD THIS LINE
    Status = @case.Status.ToString(),
    CreatedAt = @case.CreatedAt,
    CompletedAt = @case.CompletedAt,
    Notes = @case.Notes,
    LatestVitals = ...,
    MedicalReport = ...
});
```

The frontend already reads `patientGender` / `PatientGender` from the response, so once you add this, gender will show on the case page and in the PDF.
