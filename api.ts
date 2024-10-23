import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";

const app = new Hono();

const baseurl = "https://k8s-node.rentomojo.com";

app.get("/api/getKYCData", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    const response = await fetch(
      baseurl + "/api/Hyperverges/completionStatusV3",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7",
          authorization: token,
        },
      }
    );

    if (!response.ok) {
      console.log(response);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      const {
        stepsCompleted,
        totalSteps,
        currentDocument,
        evalResponse,
        lastUpdatedAt,
        professionType,
      } = data;
      let normalizedStatus = evalResponse.normalizedStatus;
      let statusMap = evalResponse.statusMap;

      const getStatusText = (statusMap, normalizedStatus) => {
        for (let key in statusMap) {
          if (statusMap[key].value === normalizedStatus) {
            return statusMap[key].key;
          }
        }
        return null;
      };

      const professionTypeMapping = {
        100: "Working Professional",
        200: "Self Employed",
        300: "Freelancer",
        500: "Student",
        1337: "Not selected profession",
        null: "Not selected profession",
      };

      let statusText = getStatusText(statusMap, normalizedStatus);
      let profession = professionTypeMapping[professionType];

      return c.json({
        stepsCompleted,
        totalSteps,
        lastUpdatedAt,
        currentDocument,
        kycStatus: statusText,
        professionType: profession,
      });
    } catch (error) {
      return c.json({ error: "Failed to parse JSON response" }, 500);
    }
  } catch (error) {
    return c.json({ error: "Request failed" }, 500);
  }
});

app.get("/api/isWorkingHours", (c) => {
  // Get the current time in UTC and convert it to IST
  const now = new Date();
  const utcOffset = now.getTimezoneOffset(); // Get the UTC offset in minutes
  const istOffset = 330; // IST is UTC+5:30, so 330 minutes ahead of UTC

  // Convert current UTC time to IST
  const istTime = new Date(now.getTime() + (istOffset + utcOffset) * 60000);

  // Define working hours: Monday to Friday, 9 AM to 5 PM IST
  const startHour = 9;
  const endHour = 20;
  const day = istTime.getDay(); // Sunday - Saturday : 0 - 6
  const hour = istTime.getHours();

  // Check if it is a weekday and within working hours
  const isWorkingHours =
    day >= 0 && day <= 6 && hour >= startHour && hour < endHour;

  return c.json({ isWorkingHours });
});

app.get("/api/currentTimeIST", (c) => {
  // Get the current time directly in IST
  const nowIST = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });

  return c.json({ currentTimeIST: nowIST });
});

app.get("/api/getServiceRequest", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    const response = await fetch(
      baseurl +
        "/api/Dashboards/getServiceRequest?query=%7B%22page%22:1,%22size%22:100%7D&activeStatus=active",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7",
          authorization: token,
          "chat-app": "bot9",
        },
      }
    );

    if (!response.ok) {
      console.log(response);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      const { results } = data;

      const formattedResults = results.map((ticket) => ({
        serviceRequestId: ticket.serviceRequestId,
        createdAt: ticket.createdAt,
        requestStatusLabel: ticket.requestStatus.label,
        requestType: ticket.requestType.label,
        isActive: ticket.isActive,
        orderItems: ticket.orderItems.map((item) => ({
          id: item.id,
          uniqueId: item.uniqueId,
          orderDate: item.orderDate,
          scheduleDate: item.scheduledDate,
          productName: item.productName,
          address: item.address,
          isMmp: item.isMmp,
          warehouseName: item.warehouseName,
        })),
        requestTimeline: ticket.requestTimeline.map((timeline) => ({
          customerLabel: timeline.customerLabel,
          createdAt: timeline.createdAt,
          driverData: timeline.driverData,
          scheduledDate: timeline.scheduledDate,
        })),
        isTicketSchedulable: ticket.isTicketSchedulable,
        isTicketreschedulable: ticket.isTicketreschedulable,
      }));
      return c.json({ results: formattedResults });
    } catch (error) {
      return c.json({ error: "Failed to parse JSON response" }, 500);
    }
  } catch (error) {
    return c.json({ error: "Request failed" }, 500);
  }
});

app.get("/api/getInactiveServiceRequest", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    const response = await fetch(
      baseurl +
        "/api/Dashboards/getServiceRequest?query=%7B%22page%22%3A1%2C%22size%22%3A100%7D&activeStatus=inactive",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: token,
        },
      }
    );

    if (!response.ok) {
      console.log(response);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      const { results } = data;

      const formattedResults = results.map((ticket) => ({
        serviceRequestId: ticket.serviceRequestId,
        createdAt: ticket.createdAt,
        requestStatusLabel: ticket.requestStatus.label,
        requestType: ticket.requestType.label,
        isActive: ticket.isActive,
        orderItems: ticket.orderItems.map((item) => ({
          id: item.id,
          uniqueId: item.uniqueId,
          orderDate: item.orderDate,
          scheduleDate: item.scheduledDate,
          productName: item.productName,
        })),
        requestTimeline: ticket.requestTimeline.map((timeline) => ({
          customerLabel: timeline.customerLabel,
          createdAt: timeline.createdAt,
          driverData: timeline.driverData,
        })),
        isTicketSchedulable: ticket.isTicketSchedulable,
        isTicketreschedulable: ticket.isTicketreschedulable,
      }));
      return c.json({ results: formattedResults });
    } catch (error) {
      return c.json({ error: "Failed to parse JSON response" }, 500);
    }
  } catch (error) {
    return c.json({ error: "Request failed" }, 500);
  }
});

app.get("/api/fetchProducts", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    const response = await fetch(
      baseurl +
        "/api/Dashboards/getServiceRequest?query=%7B%22page%22:1,%22size%22:100%7D&activeStatus=active",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7",
          authorization: token,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch data:", response.statusText);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);

      const carousel = data.results.map((product) => {
        return {
          button_label: "View Details",
          button_target: `/product/${product.id}`,
          description: `${product.name} - ${product.tenure}`,
          image: product.thumbnail,
          price: product.rentAmount,
          product_url: `/product/${product.id}`,
          title: product.name,
        };
      });

      return c.json({
        carousel: carousel,
        important_notes: "These are your rented products.",
        instruction: "Swipe to view all your rented products.",
      });
    } catch (error) {
      console.error(
        "Failed to parse JSON response:",
        error.message,
        "Response text:",
        text
      );
      return c.json(
        {
          error: "Failed to parse JSON response",
          details: error.message,
        },
        500
      );
    }
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.get("/api/getActiveProducts", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    const response = await fetch(
      baseurl + "/api/Dashboards/activeProductList",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en;q=0.9",
          authorization: token,
        },
      }
    );

    if (!response.ok) {
      console.log(response);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return c.json({ results: data });
    } catch (error) {
      return c.json({ error: "Failed to parse JSON response" }, 500);
    }
  } catch (error) {
    return c.json({ error: "Request failed" }, 500);
  }
});

app.post("/api/getCssSlots", async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  const body = await c.req.json();
  const { orderUniqueId, requestType } = body;

  if (!orderUniqueId || !requestType) {
    return c.json({ error: "orderUniqueId and requestType are required" }, 400);
  }

  try {
    const response = await fetch(baseurl + "/api/ServiceRequests/getCssSlots", {
      method: "POST",
      headers: {
        authorization: token,
        "Content-Type": "application/json",
        "chat-app": "bot9",
      },
      body: JSON.stringify({
        data: {
          orderUniqueId: orderUniqueId,
          requestType: requestType,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Failed to fetch data:", errorText);
      return c.json({ error: "Failed to fetch data", details: errorText }, 500);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return c.json({ results: data });
    } catch (error) {
      console.log("Failed to parse JSON response:", error.message);
      return c.json(
        { error: "Failed to parse JSON response", details: error.message },
        500
      );
    }
  } catch (error) {
    console.log("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/sendToSheetyold", async (c) => {
  const body = await c.req.json();
  console.log("sendToSheety", body);
  if (!body) {
    return c.json({ error: "Body is required" }, 400);
  }

  const { conversationId } = body;

  if (!conversationId) {
    return c.json({ error: "conversationId is required in the body" }, 400);
  }

  const chatUrl = `https://app.bot9.ai/inbox/${conversationId}?status=bot&search=`;

  try {
    const response = await fetch(
      "https://api.sheety.co/011fae6ddb1f69495d3220937f85baff/stagingOfBot9Form/opsCallback",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the updated ChatUrl to Sheety
        body: JSON.stringify({ opsCallback: { ...body, chatUrl: chatUrl } }),
      }
    );

    if (!response.ok) {
      console.error("Failed to send data to Sheety:", response.statusText);
      return c.json({ error: "Failed to send data to Sheety" }, 500);
    }

    const responseData = await response.json();
    console.log("sendToSheety done");
    return c.json(responseData);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/sendToSheety", async (c) => {
  try {
    const body = await c.req.json();
    console.log("sendToSheety", body);

    if (!body) {
      return c.json({ error: "Body is required" }, 400);
    }

    const {
      conversationId,
      servicerequestId,
      userid,
      marketplace,
      warehouseName,
    } = body;

    if (!conversationId || !servicerequestId) {
      return c.json(
        {
          error: "conversationId and servicerequestId are required in the body",
        },
        400
      );
    }

    const chatUrl = `https://app.bot9.ai/inbox/${conversationId}?status=bot&search=`;

    console.log("Fetching current sheet entries...");

    // Fetch current sheet entries
    const sheetResponse = await fetch(
      "https://api.sheety.co/011fae6ddb1f69495d3220937f85baff/stagingRento/opsCallback"
    );

    if (!sheetResponse.ok) {
      const errorText = await sheetResponse.text();
      console.error(
        "Failed to fetch data from Sheety:",
        sheetResponse.statusText,
        errorText
      );
      return c.json(
        { error: "Failed to fetch data from Sheety", details: errorText },
        500
      );
    }

    const sheetData = await sheetResponse.json();
    console.log("Sheet data fetched successfully:", sheetData);

    const existingEntry = sheetData.opsCallback.find(
      (entry) => entry.servicerequestId === servicerequestId
    );

    if (existingEntry) {
      console.log("Service request already exists, sending email...");

      const cityUserIds = {
        bangalore: [1732788, 1237084, 98143],
        mumbai: [1732814, 1497288, 98143],
        pune: [1732815, 1497288, 98143],
        delhi: [1732816, 96493, 98143],
        noida: [1732818, 96493, 98143],
        gurgaon: [1732819, 96493, 98143],
        hyderabad: [1732820, 1237084, 98143],
        chennai: [1732821, 1237084, 98143],
        ahmedabad: [1732823, 96493, 98143],
        mysore: [1732824, 1237084, 98143],
        jaipur: [1732825, 96493, 98143],
        faridabad: [1732827, 96493, 98143],
        ghaziabad: [1732829, 96493, 98143],
        gandhinagar: [1732830, 96493, 98143],
        chandigarh: [1732831, 96493, 98143],
        lucknow: [1732833, 96493, 98143],
        kolkata: [1732835, 1497288, 98143],
        indore: [1732836, 96493, 98143],
        kochi: [1681241, 399618, 1237084, 98143],
        hosur: [1732847, 1237084, 98143],
        pondicherry: [1732840, 1237084, 98143],
      };

      const city = body.city ? body.city.trim().toLowerCase() : "";

      let userIds;

      if (marketplace === true) {
        userIds = [992811, 98143];
      } else {
        userIds = cityUserIds[city];

        if (!userIds) {
          console.warn(
            `City "${city}" not found in mapping. Using default userIds.`
          );
          userIds = [98143];
        }
      }

      const emailBody = {
        userIds: userIds,
        channels: ["EMAIL"],
        type: "Bot9_Email_Internal2",
        name: "bot9 mail",
        duplicateCheck: true,
        variables: {
          userId: userid,
          ticketId: servicerequestId,
          comment: body.voiceofCustomer,
          locationName: body.city,
          requestTypeLabel: body.requestType,
        },
      };

      const emailResponse = await fetch(
        "https://centercom.rentomojo.com/api/communications/key/send/bulk",
        {
          method: "POST",
          headers: {
            ApiKey: "79kzTYf3oNDNsnpX823232JYYAym1Ep43.bot9",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailBody),
        }
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("Failed to send email:", errorText);
        return c.json(
          { error: "Failed to send email", details: errorText },
          emailResponse.status
        );
      }

      const emailData = await emailResponse.json();
      console.log("Email sent successfully:", emailData);

      return c.json({
        message: "Email sent successfully for existing service request",
        emailData,
      });
    } else {
      console.log("Service request not found, creating new entry in sheet...");

      const sheetyResponse = await fetch(
        "https://api.sheety.co/011fae6ddb1f69495d3220937f85baff/stagingRento/opsCallback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            opsCallback: {
              ...body,
              chatUrl: chatUrl,
              marketplace: marketplace,
              warehouse: warehouseName,
            },
          }),
        }
      );

      if (!sheetyResponse.ok) {
        const errorText = await sheetyResponse.text();
        console.error(
          "Failed to send data to Sheety:",
          sheetyResponse.statusText,
          errorText
        );
        return c.json(
          { error: "Failed to send data to Sheety", details: errorText },
          500
        );
      }

      const responseData = await sheetyResponse.json();
      console.log("sendToSheety done:", responseData);
      return c.json(responseData);
    }
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/offlineHours", async (c) => {
  const body = await c.req.json();

  if (!body) {
    return c.json({ error: "Body is required" }, 400);
  }

  const { conversationId, marketplace } = body;

  if (!conversationId) {
    return c.json({ error: "conversationId is required in the body" }, 400);
  }

  const chatUrl = `https://app.bot9.ai/inbox/${conversationId}?status=bot&search=`;

  try {
    const response = await fetch(
      "https://api.sheety.co/011fae6ddb1f69495d3220937f85baff/stagingRento/offlineHours",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offlineHour: { ...body, chatUrl: chatUrl, marketplace: marketplace },
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to send data to Sheety:", response.statusText);
      return c.json({ error: "Failed to send data to Sheety" }, 500);
    }

    const responseData = await response.json();
    return c.json(responseData);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/commitmentSheet", async (c) => {
  const body = await c.req.json();

  if (!body) {
    return c.json({ error: "Body is required" }, 400);
  }

  try {
    const response = await fetch(
      "https://api.sheety.co/011fae6ddb1f69495d3220937f85baff/mojo/otherEscalations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otherEscalation: body }),
      }
    );

    if (!response.ok) {
      console.error("Failed to send data to Sheety:", response.statusText);
      return c.json({ error: "Failed to send data to Sheety" }, 500);
    }

    const responseData = await response.json();
    return c.json(responseData);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/uploadFile", async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "Authorization token is required" }, 400);
  }

  const body = await c.req.json();
  const { media1, media2, media3 } = body;

  // Construct the imageUrls array based on provided images
  const mediaUrls = [];
  if (media1) mediaUrls.push(media1);
  if (media2) mediaUrls.push(media2);
  if (media3) mediaUrls.push(media3);

  if (mediaUrls.length === 0) {
    return c.json({ error: "At least one image URL is required" }, 400);
  }

  try {
    // Prepare the data for the URL upload request
    const payload = {
      imageUrls: mediaUrls,
    };

    // Perform the upload
    const uploadResponse = await fetch(
      baseurl + "/api/ServiceRequestImages/urlUpload",
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Failed to upload images:", errorText);
      return c.json(
        { error: "Failed to upload images", details: errorText },
        500
      );
    }

    const responseData = await uploadResponse.json();
    console.log("Images uploaded successfully");
    return c.json(responseData);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/repairTicket", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Authorization token is required" }, 400);
  }

  const body = await c.req.json();
  const { media1, media2, media3, media4, description, orderId, userId } = body;

  const mediaUrls = [];
  if (media1) mediaUrls.push(media1);
  if (media2) mediaUrls.push(media2);
  if (media3) mediaUrls.push(media3);
  if (media4) mediaUrls.push(media4);

  if (mediaUrls.length === 0) {
    return c.json({ error: "At least one image URL is required" }, 400);
  }

  try {
    // Upload images
    const uploadResponse = await fetch(
      baseurl + "/api/ServiceRequestImages/urlUpload",
      {
        method: "POST",
        headers: {
          accept: "*/*",
          authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrls: mediaUrls }),
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Failed to upload images:", errorText);
      return c.json(
        { error: "Failed to upload images", details: errorText },
        uploadResponse.status
      );
    }

    const uploadedImages = await uploadResponse.json();
    console.log("Images uploaded successfully:", uploadedImages);

    // Prepare images for ticket creation
    const images = uploadedImages.map((img, index) => ({
      url: img.url, // Assuming the response includes a `url` field
      name: img.name, // Assuming the response includes a `name` field
      userId: img.userId, // This value should be dynamically assigned or fetched if available
      id: img.id, // Assuming the response includes an `id` field
    }));

    // Create ticket
    const payload = {
      data: [
        {
          requestType: 20,
          images: images,
          orderItemId: parseInt(orderId),
          message: description,
        },
      ],
    };

    const ticketResponse = await fetch(
      baseurl + "/api/Dashboards/createNewTickets",
      {
        method: "POST",
        headers: {
          authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!ticketResponse.ok) {
      const errorText = await ticketResponse.text();
      console.error("Failed to create ticket:", errorText);
      return c.json(
        { error: "Failed to create ticket", details: errorText },
        ticketResponse.status
      );
    }

    const ticketData = await ticketResponse.json();
    console.log("Ticket created successfully:", ticketData);

    return c.json({
      uploadResponse: uploadedImages,
      ticketResponse: ticketData,
    });
  } catch (error) {
    console.error("Request failed:", error);
    return c.json(
      {
        error: "Request failed",
        details: error.message || "No details available",
      },
      500
    );
  }
});

app.post("/api/sendEmail", async (c) => {
  const apiKey =
    c.req.query("apiKey") || "79kzTYf3oNDNsnpX823232JYYAym1Ep43.bot9";

  if (!apiKey) {
    return c.json({ error: "ApiKey is required" }, 400);
  }

  try {
    const body = await c.req.json();
    const {
      userIds,
      type,
      name,
      duplicateCheck,
      ticketId,
      customerId,
      comment,
    } = body;

    // Ensure userIds is provided and format it into an array of integers
    if (!userIds || typeof userIds !== "string") {
      return c.json(
        { error: "userIds must be provided as a comma-separated string" },
        400
      );
    }

    // Convert the comma-separated userIds string into an array of integers
    const userIdsArray = userIds
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (userIdsArray.length === 0 || !type) {
      return c.json({ error: "Valid userIds and type are required" }, 400);
    }

    const channels = ["EMAIL"];
    const variables = {
      userId: customerId, // Assuming the first userId is to be used in variables
      ticketId,
      comment,
    };

    // Send email request
    const emailResponse = await fetch(
      `https://centercom.rentomojo.com/api/communications/key/send/bulk`,
      {
        method: "POST",
        headers: {
          ApiKey: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: userIdsArray,
          channels,
          type,
          name,
          duplicateCheck,
          variables,
        }),
      }
    );

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Failed to send email:", errorText);
      return c.json(
        { error: "Failed to send email", details: errorText },
        emailResponse.status
      );
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return c.json(emailData);
  } catch (error) {
    console.error("Request failed:", error);
    return c.json(
      {
        error: "Request failed",
        details: error.message || "No details available",
      },
      500
    );
  }
});

app.get("/api/getPendingRentalItems", async (c) => {
  const token = c.req.query("token");
  const userId = c.req.query("userId");

  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  if (!userId) {
    return c.json({ error: "UserId is required" }, 400);
  }

  try {
    const response = await fetch(
      baseurl + `/api/RMUsers/getPendingRentalItemsBreakUp?userId=${userId}`,
      {
        headers: {
          "accept-language": "en-GB,en;q=0.9",
          authorization: token,
        },
      }
    );

    if (!response.ok) {
      console.log(response);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return c.json({ results: data });
    } catch (error) {
      return c.json({ error: "Failed to parse JSON response" }, 500);
    }
  } catch (error) {
    return c.json({ error: "Request failed" }, 500);
  }
});

app.post("/api/cssRescheduleTicket", async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "Authorization token is required" }, 400);
  }

  const body = await c.req.json();
  const { serviceRequestId, preferredDate } = body;

  if (!serviceRequestId || !preferredDate) {
    return c.json(
      { error: "serviceRequestId and preferredDate are required" },
      400
    );
  }

  try {
    const response = await fetch(
      baseurl + "/api/ServiceRequests/cssRescheduleTicket",
      {
        method: "POST",
        headers: {
          authorization: token,
          "Content-Type": "application/json",
          "chat-app": "bot9",
        },
        body: JSON.stringify({
          data: {
            serviceRequestId: serviceRequestId,
            preferredDate: preferredDate,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to reschedule ticket:", errorText);
      return c.json(
        { error: "Failed to reschedule ticket", details: errorText },
        500
      );
    }

    const responseData = await response.json();
    return c.json(responseData);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/bookCssSlot", async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "Authorization token is required" }, 400);
  }

  const body = await c.req.json();
  const { serviceRequestId, taskDateTime } = body;

  if (!serviceRequestId || !taskDateTime) {
    return c.json(
      { error: "serviceRequestId and taskDateTime are required" },
      400
    );
  }

  try {
    const response = await fetch(baseurl + "/api/ServiceRequests/bookCssSlot", {
      method: "POST",
      headers: {
        authorization: token,
        "Content-Type": "application/json",
        "chat-app": "bot9",
      },
      body: JSON.stringify({
        data: {
          serviceRequestId: serviceRequestId,
          taskDateTime: taskDateTime,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to book CSS slot:", errorText);
      return c.json(
        { error: "Failed to book CSS slot", details: errorText },
        500
      );
    }

    const responseData = await response.json();
    return c.json(responseData);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.get("/api/getInvoices", async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    const response = await fetch(baseurl + `/api/Dashboards/getLedgersData`, {
      headers: {
        authorization: token,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch data:", response.statusText);
      return c.json({ error: "Failed to fetch data" }, 500);
    }
    const data = await response.json();

    const formattedData = data.invoices.map((invoice) => ({
      id: invoice.id,
      createdAt: invoice.createdAt,
      invoiceMonth: invoice.invoiceMonth,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      paymentStatus: invoice.paymentStatus === 20 ? "Paid" : "Unpaid",
      invoicePaidDate: invoice.invoicePaidDate,
    }));

    return c.json({ invoices: formattedData });
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/getUserLedgerInvoice", async (c) => {
  const token = c.req.query("token");
  const { invoiceId, userId } = await c.req.json();

  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  if (!invoiceId || !userId) {
    return c.json({ error: "invoiceId and userId are required" }, 400);
  }

  try {
    const response = await fetch(
      baseurl +
        `/api/RMUsers/${userId}/getUserLedgerInvoice?invoiceId=${invoiceId}&discardGstInvoiceDateCheck=true`,
      {
        headers: {
          authorization: token,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch data:", response.statusText);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    const data = await response.json();

    const formattedData = {
      id: data.id,
      invoiceDate: data.invoiceDate,
      userId: data.userId,
      invoiceNumber: data.invoiceNumber,
      address: data.address,
      rentAmount: data.rentAmount,
      paymentStatus: data.paymentStatus === 20 ? "Paid" : "Unpaid",
      invoiceUrl: `${baseurl}/dashboard/my-subscriptions/${data.id}/rental-invoice`,
      orderItemRents: data.orderItemRents.map((orderItemRent) => ({
        rentAmount: orderItemRent.rentAmount,
        billingCycleStartDate: orderItemRent.billingCycleStartDate,
        billingCycleEndDate: orderItemRent.billingCycleEndDate,
        dueDate: orderItemRent.dueDate,
        rentalMonth: orderItemRent.rentalMonth,
        productName: orderItemRent.orderItem.product.name,
        orderUniqueId: orderItemRent.orderItem.order.uniqueId,
      })),
    };

    return c.json(formattedData);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.get("/api/getRentalDue", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    const response = await fetch(baseurl + "/api/Dashboards/dashboardData", {
      headers: {
        accept: "application/json, text/plain, */*",
        authorization: token,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch data:", response.statusText);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    const data = await response.json();

    const result = {
      pendingDuesText: data.pendingDuesText,
      totalPendingRentalDueAmount: data.totalPendingRentalDueAmount,
      totalPayableAmount: data.totalPayableAmount,
      pendingLateFeeAmount: data.pendingLateFeeAmount,
      rentoMoney: data.rentoMoney,
    };

    return c.json(result);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/cancelServiceRequest", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: "Authorization token is required" }, 400);
  }

  try {
    const body = await c.req.json();
    const { serviceRequestId } = body;

    if (!serviceRequestId) {
      return c.json(
        { error: "serviceRequestId is required in the request body" },
        400
      );
    }

    const response = await fetch(
      baseurl + "/api/ServiceRequests/cancelRequest",
      {
        method: "POST",
        headers: {
          authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serviceRequestId }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to cancel request:", errorText);
      return c.json(
        { error: "Failed to cancel request", details: errorText },
        response.status
      );
    }

    const result = await response.json();
    return c.json(result);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

export default app;
